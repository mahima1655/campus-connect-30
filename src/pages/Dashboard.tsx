import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Notice, NoticeCategory, NOTICE_CATEGORIES, DEPARTMENTS } from '@/types';
import { subscribeToNotices, getNoticeStats } from '@/services/noticeService';
import Layout from '@/components/Layout';
import NoticeCard from '@/components/NoticeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Pin, 
  Calendar, 
  TrendingUp, 
  Plus,
  ArrowRight,
  Bell
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { userData, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState({ total: 0, byCategory: {} as Record<NoticeCategory, number> });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;

    const unsubscribe = subscribeToNotices(userData.role, (fetchedNotices) => {
      setNotices(fetchedNotices);
      setLoading(false);
    });

    getNoticeStats().then(setStats);

    return () => unsubscribe();
  }, [userData]);

  const pinnedNotices = notices.filter((n) => n.isPinned).slice(0, 3);
  const recentNotices = notices.slice(0, 5);
  const todayCount = notices.filter(
    (n) => n.createdAt.toDateString() === new Date().toDateString()
  ).length;

  const statCards = [
    {
      title: 'Total Notices',
      value: stats.total,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Pinned Notices',
      value: pinnedNotices.length,
      icon: Pin,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      title: 'Today\'s Updates',
      value: todayCount,
      icon: Calendar,
      color: 'text-success',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Categories',
      value: NOTICE_CATEGORIES.length,
      icon: TrendingUp,
      color: 'text-info',
      bg: 'bg-blue-500/10',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Welcome back, {userData?.displayName?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening in your college today.
            </p>
          </div>
          {(isTeacher || isAdmin) && (
            <Button onClick={() => navigate('/create-notice')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Notice
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pinned Notices */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Pin className="h-5 w-5 text-accent" />
                Pinned Notices
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notices')} className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                      <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pinnedNotices.length > 0 ? (
              <div className="space-y-4">
                {pinnedNotices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No pinned notices at the moment</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity Sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                {recentNotices.slice(0, 5).map((notice) => (
                  <div
                    key={notice.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/notices')}
                  >
                    <div className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {notice.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notice.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentNotices.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent notices
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category Quick Links */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quick Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {NOTICE_CATEGORIES.slice(0, 6).map((cat) => (
                    <Button
                      key={cat.value}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate(`/notices?category=${cat.value}`)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
