import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface AnalyticsChartProps {
  verdictCounts: any;
  recentActivity: any[];
}

export function AnalyticsChart({ verdictCounts, recentActivity }: AnalyticsChartProps) {
  const totalSubmissions: number = Object.values(verdictCounts || {}).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0) as number;

  const getVerdictPercentage = (verdict: string): number => {
    const count = Number(verdictCounts?.[verdict]) || 0;
    return totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Accepted':
        return 'bg-success';
      case 'Wrong Answer':
        return 'bg-destructive';
      case 'Time Limit Exceeded':
        return 'bg-warning';
      case 'Runtime Error':
        return 'bg-secondary';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Verdict Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribution des Verdicts
          </CardTitle>
          <CardDescription>
            Répartition des résultats de soumissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(verdictCounts).map(([verdict, count]: [string, any]) => (
            <div key={verdict} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{verdict}</span>
                <span className="text-sm text-muted-foreground">
                  {count} ({getVerdictPercentage(verdict)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getVerdictColor(verdict)}`}
                  style={{ width: `${getVerdictPercentage(verdict)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité Récente
          </CardTitle>
          <CardDescription>
            Dernières soumissions sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.users?.username} • {activity.problems?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${getVerdictColor(activity.verdict)} text-white`}>
                    {activity.verdict}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}