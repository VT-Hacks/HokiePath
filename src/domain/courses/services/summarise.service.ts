import { geminiModel } from '../../../infrastructure/geimini';
import { searchGoogle } from '../../../infrastructure/googlesearch';

/**
 * Generates the Coursicle link for a given subject and course code.
 * @param subject The subject abbreviation (e.g., "CS").
 * @param code The course code (e.g., "3214").
 * @returns The full Coursicle URL.
 */
export const getCoursicleLink = (subject: string, code: string) =>
  `https://www.coursicle.com/vt/courses/${subject}/${code}/`;

/**
 * Fetches and synthesizes a comprehensive summary of a Virginia Tech course
 * by leveraging Google search snippets and the Gemini AI model.
 * This function is designed to stream updates field by field with high accuracy.
 *
 * @param subject The course subject (e.g., "CS").
 * @param code The course code (e.g., "3214").
 * @param title The full title of the course (e.g., "Computer Systems").
 * @param onUpdate A callback function called with `(field: string, value: any)`.
 * @param onComplete A callback function called when all data has been streamed.
 * @param onError A callback function called if an error occurs during streaming.
 */
export const getExternalSummaryStreamed = async (
  subject: string,
  code: string,
  title: string,
  onUpdate: (field: string, value: any) => void,
  onComplete: () => void,
  onError: (error: any) => void
) => {
  const coursicleLink = getCoursicleLink(subject, code);

  try {
    // --- STEP 1: GATHER SEARCH SNIPPETS FOR COMPREHENSIVE DATA ---
    let searchResults = await searchGoogle(
      `${title} ${subject} ${code} Virginia Tech OR site:coursicle.com`,
      10 // Use 10 results to maximize available information
    );

    let externalLinks = searchResults
      .map((s: any) => ({
        title: s.title,
        url: s.link,
      }))
      .filter((link: any) => link.url !== coursicleLink);

    // Add the main Coursicle link to the beginning of the array to ensure it's always first.
    externalLinks.unshift({
      title: `${subject} ${code} on Coursicle`,
      url: coursicleLink,
    });

    // Immediately send out basic, non-AI-generated information
    onUpdate('course_id', `${subject} ${code}`);
    onUpdate('course_title', title);
    onUpdate('source', 'gemini-synthesis-from-snippets');
    onUpdate('last_updated', new Date().toISOString());
    onUpdate('external_links', externalLinks);
    // The 'verification_note' has been removed as requested.

    // If no search results are found, return a default empty structure and complete.
    if (!searchResults || searchResults.length === 0) {
      console.warn('No Google search results found. Cannot generate summary.');
      onUpdate(
        'summary.overview',
        'Could not find sufficient information for this course.'
      );
      onUpdate('summary.learning_objectives', []);
      onUpdate('summary.topics', []);
      onUpdate('summary.class_size', '');
      onUpdate('summary.usually_offered', []);
      onUpdate('summary.usually_held_times', []);
      onUpdate('summary.recent_semesters', []);
      onUpdate('summary.grading_components', []);
      onUpdate('summary.workload_and_difficulty', '');
      onUpdate('summary.relevant_skills', []);
      onUpdate('professors', []);
      onUpdate('reviews', []);
      onComplete();
      return;
    }

    // --- STEP 2: BUILD A HIGHLY-OPTIMIZED & ACCURATE PROMPT ---
    const sourcesForPrompt = searchResults
      .map((item: any, index: number) => {
        return `--- Source ${index + 1} ---\nTitle: ${item.title}\nLink: ${
          item.link
        }\nSnippet: ${item.snippet}`;
      })
      .join('\n\n');

    // This prompt is meticulously engineered for maximum accuracy and completeness.
    const prompt = `
You are an expert university course summarizer for Virginia Tech. Your primary goal is to extract the MOST complete, accurate, and useful structured information for the course "${subject} ${code} - ${title}" using ONLY the Google Search result snippets provided below.

**CRITICAL INSTRUCTIONS FOR COMPREHENSIVE AND ACCURATE EXTRACTION:**
1.  **Synthesize and Combine Exhaustively:** Combine and synthesize information from *all* relevant snippets to make each field as complete and accurate as possible. Be exhaustive in your extraction. Cross-reference information to ensure consistency.
2.  **Prioritize Official/Academic Sources & Coursicle for Factual Data:** Snippets from "coursicle.com" and "vt.edu" are the most reliable for factual data (descriptions, semesters, professors, class size, learning objectives, grading components, topics, relevant skills). Prioritize these for accuracy.
3.  **Extract ALL Professor Names (Full Names) with Accuracy:** List *only* professors explicitly mentioned as having taught *this specific course* (${subject} ${code}). **Crucially, cross-reference and prioritize names found on Coursicle for this exact course.** Provide full names; do not omit any found. If a name appears differently across sources, infer the most complete and accurate full name, ensuring it pertains *solely* to instructors of this course and not general departmental faculty.
4.  **Complete Semester Data (Recent & Usual):** List *all* specific recent semesters (e.g., "Fall 2024", "Spring 2023") and *all* usual offering times ("Fall", "Spring", "Summer") that can be inferred or found. Aim for the most comprehensive and accurate list.
5.  **Extract Class Size Details Precisely:** Look for any mention of class size, typical enrollment, or capacity. Extract this information precisely if available (e.g., "around 50 students", "enrollment cap of 100", "small class", "large lecture").
6.  **Detailed and COMPLETE Reviews (with Source and Sentiment):** For reviews, extract actual student opinions or qualitative feedback. **Crucially, extract the *full text* of the review without truncation or ellipses.** If a snippet contains a question *about* the course rather than a direct review *of* it, try to extract any implied sentiment or relevant information, but prioritize direct feedback. Infer a sentiment (positive, negative, neutral) if possible. **Always include the 'source' for each review.** For sources like "Reddit", "RateMyProfessors", "Chegg", or "Quizlet", if a direct link to the review source is available in the snippet, provide that specific URL as the source for the review. If only the site name is available, just use the site name (e.g., "Reddit").
7.  **Infer and Elaborate with Caution:** If a field is only partially mentioned, try to infer and elaborate *only if* the context from other snippets strongly supports it and ensures accuracy. Avoid speculation.
8.  **Strict JSON Output:** Your entire response must be a single, valid JSON object without any explanations or markdown outside the JSON. If a field is not explicitly mentioned or cannot be reasonably inferred with high confidence, leave it as an empty string "" or an empty array [].

**Required JSON Structure (Populate as completely and accurately as possible):**
{
  "overview": "A comprehensive, detailed, and accurate summary of the course. Include its purpose, main focus, and what students can expect to learn. Synthesize from Coursicle, VT.edu, and other descriptive snippets, prioritizing factual accuracy.",
  "learning_objectives": ["List key learning outcomes, skills, or competencies students are expected to gain from the course. Look for phrases like 'students will be able to...' - ensure completeness."],
  "topics": ["List", "all", "major", "topics", "or", "modules", "covered", "in", "the", "course.", "Be", "as", "exhaustive", "and", "accurate", "as", "the", "snippets", "allow."],
  "class_size": "The typical or estimated class size, if mentioned (e.g., 'small', 'large', 'around 50 students', 'enrollment cap of 100'). Provide exact figures if available.",
  "usually_offered": ["List", "all", "semesters", "the", "course", "is", "typically", "offered", "(e.g., 'Fall', 'Spring', 'Summer'). Ensure all found instances are listed."],
  "recent_semesters": ["List", "specific", "recent", "semesters", "the", "course", "was", "offered", "(e.g., 'Fall 2024', 'Spring 2023'). List as many accurate instances as can be found."],
  "professors": ["List", "full", "names", "of", "all", "professors", "who", "have", "taught", "this", "course", "or", "are", "associated", "with", "it", "in", "the", "snippets.", "Do", "not", "abbreviate.", "Prioritize names from official sources."],
  "grading_components": ["Breakdown", "of", "how", "the", "course", "is", "graded", "(e.g., 'Exams: 40%', 'Projects: 30%', 'Homework: 30%', 'Participation: 10%'). If specific percentages are not available, list the components only. Ensure accuracy."],
  "workload_and_difficulty": "A qualitative assessment of the course's workload, difficulty, and time commitment, based on student reviews or descriptions (e.g., 'high workload, challenging but rewarding', 'moderate difficulty', 'requires significant self-study'). Aim for a concise but comprehensive assessment.",
  "reviews": [
    {
      "source": "e.g., Reddit, Coursicle, RateMyProfessors, or direct URL if available",
      "review": "The complete and un-truncated student comment or opinion. Extract the full text of the review.",
      "sentiment": "positive/negative/neutral"
    }
  ],
  "relevant_skills": ["List", "any", "specific", "programming", "languages,", "software", "tools,", "methodologies,", "or", "advanced", "concepts", "that", "are", "highly", "relevant", "to", "the", "course", "content", "or", "required", "for", "success", "(e.g., 'C++', 'Linux', 'Data Structures', 'Agile Methodologies'). Ensure all relevant skills are listed."],
}

--- PROVIDED SEARCH SNIPPETS START ---
${sourcesForPrompt}
--- PROVIDED SEARCH SNIPPETS END ---
`;
    let jsonBuffer = '';
    const currentParsedState: { [key: string]: any } = {
      summary: {},
    };

    const summaryKeys = [
      'overview',
      'learning_objectives',
      'topics',
      'class_size',
      'usually_offered',
      'usually_held_times', // Added new field
      'recent_semesters',
      'grading_components',
      'workload_and_difficulty',
      'relevant_skills',
    ];
    const topLevelKeys = ['professors', 'reviews'];

    // --- STEP 3: EXECUTE AND PARSE THE STREAMING RESPONSE ---
    for await (const chunk of await geminiModel.stream(prompt)) {
      jsonBuffer += chunk.content;
      const match = jsonBuffer.match(/\{[\s\S]*\}/);
      if (match) {
        let potentialJson = match[0];
        try {
          const tempParsed = JSON.parse(potentialJson);

          for (const key of summaryKeys) {
            if (
              tempParsed[key] !== undefined &&
              JSON.stringify(tempParsed[key]) !==
                JSON.stringify(currentParsedState.summary[key])
            ) {
              currentParsedState.summary[key] = tempParsed[key];
              onUpdate(`summary.${key}`, tempParsed[key]);
            }
          }

          for (const key of topLevelKeys) {
            if (
              tempParsed[key] !== undefined &&
              JSON.stringify(tempParsed[key]) !==
                JSON.stringify(currentParsedState[key])
            ) {
              currentParsedState[key] = tempParsed[key];
              onUpdate(key, tempParsed[key]);
            }
          }
          jsonBuffer = jsonBuffer.substring(
            match.index! + potentialJson.length
          );
        } catch (e) {
          // JSON is incomplete, wait for more chunks.
        }
      }
    }

    // --- STEP 4: FINAL CHECK AND COMPLETE ---
    const finalMatch = jsonBuffer.match(/\{[\s\S]*\}/);
    if (finalMatch) {
      try {
        const finalParsed = JSON.parse(finalMatch[0]);
        for (const key of summaryKeys) {
          if (
            finalParsed[key] !== undefined &&
            JSON.stringify(finalParsed[key]) !==
              JSON.stringify(currentParsedState.summary[key])
          ) {
            onUpdate(`summary.${key}`, finalParsed[key]);
          }
        }
        for (const key of topLevelKeys) {
          if (
            finalParsed[key] !== undefined &&
            JSON.stringify(finalParsed[key]) !==
              JSON.stringify(currentParsedState[key])
          ) {
            onUpdate(key, finalParsed[key]);
          }
        }
      } catch (e) {
        console.error('Error parsing final JSON from stream:', e);
        onError(e);
      }
    }

    onComplete();
  } catch (error) {
    console.error('Error in getExternalSummaryStreamed:', error);
    onError(error);
  }
};
