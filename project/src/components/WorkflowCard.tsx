import React from 'react';
import { useState } from 'react';
import { User, Users, Truck, Package, Settings, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

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
  departmentCode?: string;
  onDepartmentAccess?: (departmentTitle: string, code: string) => Promise<boolean>;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  title,
  description,
  steps,
  icon: Icon,
  color,
  nextProcess,
  onStepClick,
  departmentCode,
  onDepartmentAccess
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleCardClick = async () => {
    if (isAuthenticated || !departmentCode || !onDepartmentAccess) {
      // Si ya está autenticado o no requiere autenticación, proceder normalmente
      return;
    }

    // Solicitar código de acceso
    const { value: inputCode } = await Swal.fire({
      title: `🔐 Acceso a ${title}`,
      html: `
        <div class="text-center">
          <div class="w-16 h-16 ${color} rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <p class="text-gray-600 mb-4">Ingresa el código de acceso para este departamento</p>
        </div>
      `,
      input: 'password',
      inputPlaceholder: 'Código de acceso',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Acceder',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar el código de acceso';
        }
      }
    });

    if (inputCode) {
      const isValid = await onDepartmentAccess(title, inputCode);
      if (isValid) {
        setIsAuthenticated(true);
        await Swal.fire({
          icon: 'success',
          title: '¡Acceso concedido!',
          text: `Ahora puedes ver los detalles de ${title}`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Código incorrecto',
          text: 'El código de acceso no es válido. Intenta nuevamente.',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300';
      case 'active':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400';
    }
  };

  const getAssigneeIconColor = (assigneeName: string) => {
    switch (assigneeName.toLowerCase()) {
      case 'facturación': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'logística': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'transporte': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'aduanas': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'despacho': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'calidad': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'gestión': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      case 'especial': return 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400';
      case 'admin': return 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400';
      case 'entrega': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'finanzas': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400';
    }
  };

  // Calcular el total de items en este departamento
  const totalItems = steps.reduce((total, step) => {
    return total + (step.detailedStates?.reduce((stepTotal, state) => stepTotal + state.count, 0) || 0);
  }, 0);

  return (
    <div 
      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-4 lg:p-6 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] relative h-full flex flex-col min-h-[400px] lg:min-h-[450px]`}
      onClick={handleCardClick}
    >
      {/* Header del departamento */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
        
        {/* Indicador de estado de autenticación */}
        <div className="flex flex-col items-center space-y-1">
          {isAuthenticated ? (
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
          )}
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
            {totalItems} items
          </span>
        </div>
      </div>

      {/* Contenido de los pasos */}
      <div className="space-y-3 lg:space-y-4 flex-1">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className={`p-3 lg:p-4 rounded-xl border-2 transition-all duration-200 ${getStepStatusColor(step.status)}`}>
              {/* Header del paso */}
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-xs lg:text-sm mb-1">{step.title}</h4>
                  <p className="text-xs opacity-80 hidden lg:block">{step.description}</p>
                </div>
                
                {step.assignee && (
                  <div className="flex items-center space-x-1 lg:space-x-2 ml-2 lg:ml-4">
                    <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center ${getAssigneeIconColor(step.assignee.name)} shadow-sm`}>
                      <step.assignee.icon className="w-3 h-3 lg:w-4 lg:h-4" />
                    </div>
                    <span className="text-xs font-medium hidden lg:inline">{step.assignee.name}</span>
                  </div>
                )}
              </div>
              
              {/* Estados detallados */}
              {step.detailedStates && step.detailedStates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                    Estados ({step.detailedStates.reduce((sum, state) => sum + state.count, 0)} items):
                  </div>
                  <div className="grid grid-cols-1 gap-1 lg:gap-2">
                    {step.detailedStates.map((state, stateIndex) => (
                      <div key={stateIndex} className="flex items-center justify-between p-1.5 lg:p-2 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                        <span className={`inline-flex items-center px-1.5 lg:px-2 py-0.5 lg:py-1 text-xs font-medium rounded-full ${state.color} truncate flex-1 mr-1 lg:mr-2`}>
                          {state.name}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white bg-white/70 dark:bg-gray-800/70 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full">
                          {state.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {step.dueDate && (
                <div className="mt-2 lg:mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Vence: {step.dueDate}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Línea de conexión al siguiente paso */}
            {index < steps.length - 1 && steps.length > 1 && (
              <div className="flex justify-center my-2">
                <div className="w-0.5 h-4 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer con estado de acceso */}
      <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isAuthenticated ? '✅ Acceso autorizado' : '🔒 Requiere código de acceso'}
          </div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Total: {totalItems} items
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCard;