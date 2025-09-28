import { TogetherAIEmbeddings } from '@langchain/community/embeddings/togetherai';
import { config } from '../config';
export const embedder = new TogetherAIEmbeddings({
  model: 'BAAI/bge-base-en-v1.5',
  batchSize: 100,
  timeout: 120000,
  apiKey: config.togetherApi,
});
