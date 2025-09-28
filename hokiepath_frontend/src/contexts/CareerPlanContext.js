import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { careerPlanAPI } from '../services/api';

const CareerPlanContext = createContext();

export const useCareerPlan = () => {
  const context = useContext(CareerPlanContext);
  if (!context) {
    throw new Error('useCareerPlan must be used within a CareerPlanProvider');
  }
  return context;
};

export const CareerPlanProvider = ({ children }) => {
  const { user } = useAuth();
  const [careerPlans, setCareerPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planFlowchart, setPlanFlowchart] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateCareerPlans = useCallback(async () => {
    if (!user?.id) return { success: false, message: 'User not logged in.' };

    setLoading(true);
    try {
      const result = await careerPlanAPI.generateCareerPlans(user.id);
      if (result.success) {
        setCareerPlans(result.data.plans || []);
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error generating career plans:', error);
      return { success: false, message: 'Failed to generate career plans.' };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const selectCareerPlan = useCallback(async (planId) => {
    if (!user?.id) return { success: false, message: 'User not logged in.' };

    setLoading(true);
    try {
      const result = await careerPlanAPI.getCareerPlanFlowchart(planId);
      if (result.success) {
        setSelectedPlan(result.data);
        setPlanFlowchart(result.data);
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error selecting career plan:', error);
      return { success: false, message: 'Failed to load career plan details.' };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const clearCareerPlans = useCallback(() => {
    setCareerPlans([]);
    setSelectedPlan(null);
    setPlanFlowchart(null);
  }, []);

  const contextValue = {
    careerPlans,
    selectedPlan,
    planFlowchart,
    loading,
    generateCareerPlans,
    selectCareerPlan,
    clearCareerPlans
  };

  return (
    <CareerPlanContext.Provider value={contextValue}>
      {children}
    </CareerPlanContext.Provider>
  );
};
