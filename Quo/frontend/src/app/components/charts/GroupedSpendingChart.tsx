// app/components/charts/GroupedSpendingChart.tsx
'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronDown, ChevronRight, Info, AlertCircle } from 'lucide-react';

interface GroupedCategory {
  name: string;
  total: number;
  percentage: number;
  categories: Array<{ name: string; amount: number }>;
}

interface GroupedSpendingChartProps {
  groupedData: GroupedCategory[] | Record<string, any> | null | undefined;
  total: number;
  insights?: any;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#DDA0DD', '#F4A460', '#98D8C8', '#FFD93D'
];

export default function GroupedSpendingChart({ 
  groupedData, 
  total, 
  insights 
}: GroupedSpendingChartProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  console.log('GroupedSpendingChart received:', {
    groupedData,
    isArray: Array.isArray(groupedData),
    type: typeof groupedData,
    total
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Handle empty or invalid data
  if (!groupedData || typeof groupedData !== 'object') {
    console.log('No grouped data available');
    return (
      <div className="p-8 text-center">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No grouped data available</p>
        <p className="text-sm text-gray-500 mt-2">Try switching to "All Categories" view</p>
      </div>
    );
  }

  // Process the data into a consistent format
  let processedData: any[] = [];
  
  // If it's already an array, use it directly
  if (Array.isArray(groupedData)) {
    console.log('Processing array format data');
    processedData = groupedData.map(item => ({
      name: item.name || 'Unknown',
      value: item.total || 0,
      percentage: item.percentage || ((item.total || 0) / total * 100),
      categories: item.categories || []
    }));
  } else if (typeof groupedData === 'object') {
    // Handle legacy object format
    console.log('Processing object format data');
    processedData = Object.entries(groupedData).map(([groupName, groupData]: [string, any]) => {
      let groupTotal = 0;
      let groupCategories = [];
      
      // Handle different possible structures
      if (groupData && typeof groupData === 'object') {
        if (groupData.total !== undefined) {
          // New format with total property
          groupTotal = groupData.total;
          groupCategories = groupData.subcategories || groupData.categories || [];
        } else if (Array.isArray(groupData)) {
          // Old format - array of categories
          groupTotal = groupData.reduce((sum, cat) => sum + (cat.amount || 0), 0);
          groupCategories = groupData;
        }
      }
      
      return {
        name: groupName,
        value: groupTotal,
        percentage: (groupTotal / total * 100),
        categories: groupCategories
      };
    });
  }
  
  // Filter out empty groups and sort by value
  processedData = processedData
    .filter(item => item && item.value > 0)
    .sort((a, b) => b.value - a.value);
  
  console.log('Processed data:', processedData);
  
  if (processedData.length === 0) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-gray-600">No spending data to display</p>
        <p className="text-sm text-gray-500 mt-2">
          {total > 0 ? 'Categories could not be grouped' : 'No transactions found for this period'}
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-600">{data.payload.percentage.toFixed(1)}% of total</p>
          {data.payload.categories && data.payload.categories.length > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              Contains {data.payload.categories.length} categories
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const chartData = processedData;

  return (
    <div className="w-full">
      {/* Chart Type Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 rounded ${
              chartType === 'pie' ? 'bg-white shadow-sm' : ''
            }`}
          >
            Pie Chart
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded ${
              chartType === 'bar' ? 'bg-white shadow-sm' : ''
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Chart */}
        <div className="flex-1">
          {chartType === 'pie' ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => percentage > 5 ? `${percentage.toFixed(0)}%` : ''}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 space-y-2 overflow-y-auto">
              {chartData.map((group, index) => (
                <div key={group.name} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="w-32 text-sm truncate">{group.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${Math.min(group.percentage, 100)}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {formatCurrency(group.value)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 w-12 text-right">
                    {group.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Groups List */}
        <div className="lg:w-1/3">
          <h4 className="font-semibold text-gray-700 mb-3">Spending Groups</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chartData.map((group, index) => {
              const isExpanded = expandedGroups.has(group.name);
              const hasCategories = group.categories && Array.isArray(group.categories) && group.categories.length > 0;
              
              return (
                <div key={group.name} className="border rounded-lg">
                  <div 
                    className={`flex items-center gap-2 p-3 ${hasCategories ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => hasCategories && toggleGroup(group.name)}
                  >
                    {hasCategories ? (
                      isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : (
                      <div className="w-4" />
                    )}
                    <div 
                      className="w-4 h-4 rounded flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm flex-1 font-medium">{group.name}</span>
                    <span className="text-sm font-semibold">{formatCurrency(group.value)}</span>
                  </div>
                  
                  {/* Expanded Categories */}
                  {isExpanded && hasCategories && (
                    <div className="px-3 pb-3">
                      <div className="ml-8 space-y-1 border-l-2 pl-3">
                        {group.categories.map((cat: any, catIndex: number) => (
                          <div key={catIndex} className="flex items-center justify-between text-xs text-gray-600">
                            <span className="truncate mr-2">{cat.name || 'Unknown'}</span>
                            <span className="font-medium">{formatCurrency(cat.amount || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Groups:</span>
              <span className="font-semibold">{chartData.length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Total Spending:</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="mt-6">
          {/* Category Insights */}
          {insights.category_insights && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Category Insights
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                {/* Largest Category */}
                {insights.category_insights.largest_super_category && (
                  <div>
                    <p className="font-medium">Largest Category:</p>
                    <p className="ml-2">
                      • {insights.category_insights.largest_super_category.name} - {formatCurrency(insights.category_insights.largest_super_category.amount)} ({insights.category_insights.largest_super_category.percentage?.toFixed(1)}%)
                    </p>
                  </div>
                )}
                
                {/* Most Diverse Category */}
                {insights.category_insights.most_diverse_category && (
                  <div>
                    <p className="font-medium">Most Diverse Category:</p>
                    <p className="ml-2">
                      • {insights.category_insights.most_diverse_category.name} ({insights.category_insights.most_diverse_category.num_subcategories} subcategories)
                    </p>
                  </div>
                )}
                
                {/* Concentration Score */}
                {insights.category_insights.concentration_score !== undefined && (
                  <div>
                    <p className="font-medium">Spending Concentration:</p>
                    <p className="ml-2">
                      • {insights.category_insights.concentration_score > 0.5 ? 'Highly concentrated' : insights.category_insights.concentration_score > 0.3 ? 'Moderately concentrated' : 'Well distributed'} (Score: {insights.category_insights.concentration_score.toFixed(2)})
                    </p>
                  </div>
                )}
                
                {/* Recommendations */}
                {insights.category_insights.recommendations && insights.category_insights.recommendations.length > 0 && (
                  <div>
                    <p className="font-medium">Recommendations:</p>
                    {insights.category_insights.recommendations.map((rec: string, idx: number) => (
                      <p key={idx} className="ml-2">• {rec}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* General Insights */}
          {insights.has_uncategorized && (
            <div className="p-4 bg-amber-50 rounded-lg mt-3">
              <p className="text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Some transactions are uncategorized. Review them for better insights.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
