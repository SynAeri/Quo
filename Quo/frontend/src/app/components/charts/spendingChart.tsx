// app/components/charts/GroupedSpendingChart.tsx
'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

interface GroupedCategory {
  name: string;
  total: number;
  percentage: number;
  categories: Array<{ name: string; amount: number }>;
}

interface GroupedSpendingChartProps {
  groupedData: Record<string, GroupedCategory> | null | undefined;
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

  // Handle different data formats
  if (!groupedData || typeof groupedData !== 'object') {
    return (
      <div className="p-8 text-center">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No grouped data available</p>
        <p className="text-sm text-gray-500 mt-2">Try switching to "All Categories" view</p>
      </div>
    );
  }

  // Convert data to the expected format
  let processedData: any[] = [];
  
  // Check if groupedData is already in array format
  if (Array.isArray(groupedData)) {
    processedData = groupedData;
  } else {
    // Convert object entries to array format
    processedData = Object.entries(groupedData).map(([name, data]) => {
      // Handle different possible data structures
      if (typeof data === 'object' && data !== null) {
        // If data has the expected structure
        if ('total' in data || 'amount' in data) {
          return {
            name,
            value: data.total || data.amount || 0,
            percentage: data.percentage || ((data.total || data.amount || 0) / total * 100),
            categories: data.categories || []
          };
        }
        // If data is a simple {name, amount, percentage} object
        else if ('name' in data && 'amount' in data) {
          return {
            name: data.name,
            value: data.amount,
            percentage: data.percentage || (data.amount / total * 100),
            categories: []
          };
        }
      }
      // If data is just a number
      else if (typeof data === 'number') {
        return {
          name,
          value: data,
          percentage: (data / total * 100),
          categories: []
        };
      }
      
      // Fallback
      return {
        name,
        value: 0,
        percentage: 0,
        categories: []
      };
    });
  }
  
  // Filter out invalid entries
  processedData = processedData.filter(item => item && item.value > 0);
  
  if (processedData.length === 0) {
    return (
      <div className="p-8 text-center">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No spending data to display</p>
      </div>
    );
  }

  const chartData = processedData
    .sort((a, b) => b.value - a.value)
    .map(item => ({
      ...item,
      percentage: item.percentage || (item.value / total * 100)
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const groupData = groupedData[data.name];
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-600">{data.payload.percentage.toFixed(1)}% of total</p>
          {groupData && groupData.categories && (
            <p className="text-xs text-blue-600 mt-1">
              Contains {groupData.categories.length} categories
            </p>
          )}
        </div>
      );
    }
    return null;
  };

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
            <div className="h-96 space-y-2">
              {chartData.map((group, index) => (
                <div key={group.name} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="w-32 text-sm truncate">{group.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${group.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {formatCurrency(group.value)}
                    </span>
                  </div>
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
              
              return (
                <div key={group.name} className="border rounded-lg">
                  <div 
                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(group.name)}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm flex-1 font-medium">{group.name}</span>
                    <span className="text-sm font-semibold">{formatCurrency(group.value)}</span>
                  </div>
                  
                  {/* Expanded Categories */}
                  {isExpanded && group.categories && group.categories.length > 0 && (
                    <div className="px-3 pb-3">
                      <div className="ml-6 space-y-1 border-l-2 pl-3">
                        {group.categories.map((cat, catIndex) => (
                          <div key={catIndex} className="flex items-center justify-between text-xs text-gray-600">
                            <span>{cat.name}</span>
                            <span>{formatCurrency(cat.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights && insights.category_insights && Object.keys(insights.category_insights).length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Insights
          </h3>
          <div className="space-y-1 text-sm text-blue-800">
            {Object.entries(insights.category_insights).map(([key, value]: [string, any]) => (
              <p key={key}>• {value}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
