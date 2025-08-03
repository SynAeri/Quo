// app/components/charts/FilterableSpendingChart.tsx
'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronRight, ChevronLeft, Info, Filter } from 'lucide-react';

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

interface FilterableSpendingChartProps {
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

// Categories that should be filtered to secondary view
const FILTER_CATEGORIES = ['unknown', 'uncategorized', 'other', 'no category', 'non-depository financing'];

export default function FilterableSpendingChart({ 
  data, 
  enhancedCategories, 
  total, 
  chartType = 'bar' 
}: FilterableSpendingChartProps) {
  const [showSecondary, setShowSecondary] = useState(false);
  const [selectedLargeCategory, setSelectedLargeCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate average spending per category
  const avgSpending = total / data.length;
  
  // Identify categories that are either in FILTER_CATEGORIES or are 3x larger than average
  const isLargeOrSpecialCategory = (category: SpendingCategory) => {
    return FILTER_CATEGORIES.includes(category.name.toLowerCase()) || 
           category.amount > avgSpending * 3;
  };

  // Separate primary and secondary categories
  const primaryCategories = data.filter(cat => !isLargeOrSpecialCategory(cat));
  const secondaryCategories = data.filter(cat => isLargeOrSpecialCategory(cat));
  
  // Calculate totals
  const primaryTotal = primaryCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const secondaryTotal = secondaryCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // Current view data
  const currentData = showSecondary ? secondaryCategories : primaryCategories;
  const currentTotal = showSecondary ? secondaryTotal : primaryTotal;

  // Add percentages
  const dataWithPercentage = currentData.map(item => ({
    ...item,
    percentage: ((item.amount / currentTotal) * 100).toFixed(1),
    hasSubcategories: !!enhancedCategories[item.name]
  }));

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const hasSubcategories = enhancedCategories[data.name];
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-600">{data.payload.percentage}% of {showSecondary ? 'large categories' : 'regular spending'}</p>
          {hasSubcategories && (
            <p className="text-xs text-blue-600 mt-1">
              {enhancedCategories[data.name].subcategories.length} AI-detected patterns
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
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
                  setSelectedLargeCategory(data.name);
                }
              }}
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  style={{ cursor: enhancedCategories[entry.name] ? 'pointer' : 'default' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Bar chart with better scaling
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={dataWithPercentage}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="amount" 
            fill="#8884d8"
            onClick={(data) => {
              if (enhancedCategories[data.name]) {
                setSelectedLargeCategory(data.name);
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
    );
  };

  return (
    <div className="w-full">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {showSecondary ? 'Large & Special Categories' : 'Regular Categories'}
          </h3>
          {secondaryCategories.length > 0 && (
            <button
              onClick={() => {
                setShowSecondary(!showSecondary);
                setSelectedLargeCategory(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              {showSecondary ? (
                <>
                  <ChevronLeft size={16} />
                  View Regular Categories
                </>
              ) : (
                <>
                  View Large Categories ({secondaryCategories.length})
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          Total: {formatCurrency(currentTotal)}
        </div>
      </div>

      {/* Info Banner */}
      {!showSecondary && secondaryCategories.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Info className="text-blue-600 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Filtered View Active</p>
            <p>Showing {primaryCategories.length} regular categories. 
               {secondaryCategories.length} large/special categories hidden for clarity.</p>
          </div>
        </div>
      )}

      {/* Main Chart */}
      {renderChart()}

      {/* Category List */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-3">
            {showSecondary ? 'Large Categories Breakdown' : 'Categories in View'}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dataWithPercentage.map((item, index) => {
              const isExpanded = expandedCategories.has(item.name);
              const hasNLP = enhancedCategories[item.name];
              
              return (
                <div key={item.name} className="border rounded-lg p-2">
                  <div 
                    className={`flex items-center gap-2 ${hasNLP ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => hasNLP && toggleCategory(item.name)}
                  >
                    {hasNLP && (
                      isExpanded ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />
                    )}
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm flex-1">
                      {item.name}
                      {hasNLP && <span className="text-xs text-blue-600 ml-2">(AI analysis available)</span>}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                  
                  {/* NLP Subcategories */}
                  {isExpanded && hasNLP && (
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

        {/* Selected Category Details Panel */}
        {selectedLargeCategory && enhancedCategories[selectedLargeCategory] && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">
              AI Analysis: {selectedLargeCategory}
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={enhancedCategories[selectedLargeCategory].subcategories}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ name }) => name}
                    >
                      {enhancedCategories[selectedLargeCategory].subcategories.map((entry, index) => (
                        <Cell key={`subcell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {enhancedCategories[selectedLargeCategory].subcategories
                  .sort((a, b) => b.amount - a.amount)
                  .map((sub, index) => (
                    <div key={sub.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{sub.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">({sub.count})</span>
                        <span className="font-medium">{formatCurrency(sub.amount)}</span>
                      </div>
                    </div>
                  ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(enhancedCategories[selectedLargeCategory].total)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  AI detected {enhancedCategories[selectedLargeCategory].subcategories.length} patterns in {enhancedCategories[selectedLargeCategory].count} transactions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Regular Spending</p>
          <p className="text-lg font-semibold">{formatCurrency(primaryTotal)}</p>
          <p className="text-xs text-gray-500">{primaryCategories.length} categories</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Large/Special Categories</p>
          <p className="text-lg font-semibold">{formatCurrency(secondaryTotal)}</p>
          <p className="text-xs text-gray-500">{secondaryCategories.length} categories</p>
        </div>
      </div>
    </div>
  );
}
