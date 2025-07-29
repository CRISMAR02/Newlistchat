import React from 'react';
import { User, Users, Truck, Package, Settings, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  assignee?: {
    name: string;
    icon: React.ComponentType<any>;
  };
  dueDate?: string;
  detailedStates?: {
    name: string;
    count: number;
    color: string;
  }[];
}

interface WorkflowCardProps {
  title: string;
  description: string;
  steps: WorkflowStep[];
  icon: React.ComponentType<any>;
  color: string;
  nextProcess?: string | null;
  onStepClick?: (step: WorkflowStep) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  title,
  description,
  steps,
  icon: Icon,
  color,
  nextProcess,
  onStepClick,
}) => {

  // Calcular el total de items en este departamento
  const totalItems = steps.reduce((total, step) => {
    return total + (step.detailedStates?.reduce((stepTotal, state) => stepTotal + state.count, 0) || 0);
  }, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 h-full flex flex-col">
      {/* Header simplificado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{totalItems} items</p>
          </div>
        </div>
      </div>

      {/* Estados listados verticalmente */}
      <div className="flex-1">
        {steps.map((step) => (
          <div key={step.id} className="mb-3">
            {step.detailedStates && step.detailedStates.length > 0 && (
              <div className="space-y-2">
                {step.detailedStates.map((state, stateIndex) => (
                  <div 
                    key={stateIndex} 
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onStepClick?.(step)}
                  >
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {state.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded-md min-w-[2rem] text-center">
                      {state.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer con total */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-sm font-bold text-gray-900">{totalItems}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCard;