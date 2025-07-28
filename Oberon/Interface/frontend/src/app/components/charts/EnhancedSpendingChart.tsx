// app/components/charts/EnhancedSpendingChart.tsx
'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

interface SpendingCategory {
  name: string;
  amount: number;
}

interface Subcategory {
  name: string;
  amount: number;
  count: number;
}

interface EnhancedCategory {
  total: number;
  count: number;
  subcategories: Subcategory[];
}

interface EnhancedSpendingChartProps {
  data: SpendingCategory[];
  enhancedCategories: Record<string, EnhancedCategory>;
  total: number;
  chartType?: 'pie' | 'bar';
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#DDA0DD', '#F4A460', '#98D8C8', '#FFD93D'
];

export default function EnhancedSpendingChart({ 
  data, 
  enhancedCategories, 
  total, 
  chartType = 'pie' 
}: EnhancedSpendingChartProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
      setSelectedCategory(null);
    } else {
      newExpanded.add(categoryName);
      setSelectedCategory(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: ((item.amount / total) * 100).toFixed(1),
    hasSubcategories: !!enhancedCategories[item.name]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const hasSubcategories = enhancedCategories[data.name];
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-600">{data.payload.percentage}% of total</p>
          {hasSubcategories && (
            <p className="text-xs text-blue-600 mt-1">
              Click to see {enhancedCategories[data.name].subcategories.length} subcategories
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Main Chart */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {chartType === 'pie' ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={dataWithPercentage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="amount"
                  onClick={(data) => {
                    if (enhancedCategories[data.name]) {
                      toggleCategory(data.name);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {dataWithPercentage.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke={entry.hasSubcategories ? '#333' : 'none'}
                      strokeWidth={entry.hasSubcategories ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dataWithPercentage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="#8884d8"
                  onClick={(data) => {
                    if (enhancedCategories[data.name]) {
                      toggleCategory(data.name);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {dataWithPercentage.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category List with Expandable Items */}
        <div className="lg:w-1/3">
          <h4 className="font-semibold text-gray-700 mb-3">Categories</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dataWithPercentage.map((item, index) => {
              const isExpanded = expandedCategories.has(item.name);
              const hasSubcategories = enhancedCategories[item.name];
              
              return (
                <div key={item.name} className="border rounded-lg p-2">
                  <div 
                    className={`flex items-center gap-2 ${hasSubcategories ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => hasSubcategories && toggleCategory(item.name)}
                  >
                    {hasSubcategories && (
                      isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm flex-1">{item.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                  
                  {/* Subcategories */}
                  {isExpanded && hasSubcategories && (
                    <div className="mt-2 ml-6 space-y-1 border-l-2 pl-3">
                      {enhancedCategories[item.name].subcategories.map((sub, subIndex) => (
                        <div key={sub.name} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{sub.name} ({sub.count} transactions)</span>
                          <span>{formatCurrency(sub.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Category Details */}
      {selectedCategory && enhancedCategories[selectedCategory] && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            {selectedCategory} Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={enhancedCategories[selectedCategory].subcategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ name }) => name}
                >
                  {enhancedCategories[selectedCategory].subcategories.map((entry, index) => (
                    <Cell key={`subcell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex items-center">
              <div className="text-sm space-y-1">
                <p className="flex items-center gap-1">
                  <Info size={14} />
                  <span>AI-detected patterns in "{selectedCategory}" transactions</span>
                </p>
                <p className="text-gray-600">
                  Total: {formatCurrency(enhancedCategories[selectedCategory].total)}
                </p>
                <p className="text-gray-600">
                  Transactions: {enhancedCategories[selectedCategory].count}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
