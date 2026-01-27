import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Notice, getCategoryColor, NOTICE_CATEGORIES, User as AppUser, VisibleTo } from '@/types';
import { subscribeToNotices, markNoticeAsSeen, subscribeToNoticeViews } from '@/services/noticeService';
import { getUsersByIds } from '@/services/userService';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
    Calendar,
    User,
    Download,
    FileText,
    ExternalLink,
    Tag,
    Building,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Eye,
    Users as UsersIcon
} from 'lucide-react';

const NoticeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [noticeViews, setNoticeViews] = useState<{ uid: string; displayName: string; role: string; seenAt: Date }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingViewers, setLoadingViewers] = useState(false);

    useEffect(() => {
        if (!userData) return;

        const unsubscribe = subscribeToNotices(userData.role, (fetchedNotices) => {
            setNotices(fetchedNotices);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData]);

    const { currentNotice, prevNotice, nextNotice } = useMemo(() => {
        if (!notices.length || !id) return { currentNotice: null, prevNotice: null, nextNotice: null };

        const index = notices.findIndex(n => n.id === id);
        if (index === -1) return { currentNotice: null, prevNotice: null, nextNotice: null };

        return {
            currentNotice: notices[index],
            prevNotice: index > 0 ? notices[index - 1] : null,
            nextNotice: index < notices.length - 1 ? notices[index + 1] : null,
        };
    }, [notices, id]);

    // Merge legacy viewers (from notice doc) and new viewers (from separate collection)
    const mergedViewers = useMemo(() => {
        const viewersMap = new Map();

        // 1. Add legacy viewers
        if (currentNotice?.viewedBy) {
            currentNotice.viewedBy.forEach(v => {
                if (!v.uid) return;

                // Get name from resolved allUsers if available
                const user = allUsers.find(u => u.uid === v.uid);
                const displayName = user?.displayName || v.displayName || 'User';
                const role = user?.role || v.role || 'unknown';

                viewersMap.set(v.uid, {
                    uid: v.uid,
                    displayName,
                    role,
                    seenAt: v.seenAt
                });
            });
        }

        // 2. Add new collection viewers (overwrite legacy if exists)
        noticeViews.forEach(v => {
            if (!v.uid) return;

            const user = allUsers.find(u => u.uid === v.uid);
            const displayName = user?.displayName || v.displayName || 'User';
            const role = user?.role || v.role || 'unknown';

            viewersMap.set(v.uid, {
                ...v,
                displayName,
                role
            });
        });

        return Array.from(viewersMap.values()).sort((a, b) => b.seenAt.getTime() - a.seenAt.getTime());
    }, [currentNotice?.viewedBy, noticeViews, allUsers]);

    // Track views efficiently
    const [viewMarked, setViewMarked] = useState(false);

    useEffect(() => {
        if (userData && id && currentNotice && !viewMarked) {
            // Check if already viewed in the merged state
            const alreadyViewed = mergedViewers.some(v => v.uid === userData.uid);
            if (!alreadyViewed) {
                setViewMarked(true); // Prevent multiple attempts if it fails
                markNoticeAsSeen(
                    id,
                    userData.uid,
                    userData.displayName || 'User',
                    userData.role
                ).catch(err => {
                    console.error('Failed to mark notice as seen. This is likely a Firebase Permission issue.', err);
                });
            }
        }
    }, [id, userData, currentNotice, noticeViews.length, viewMarked]);

    // Subscribe to views for this notice
    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribeToNoticeViews(id, (views) => {
            setNoticeViews(views);
        });
        return () => unsubscribe();
    }, [id]);

    // Resolve missing names for legacy or incomplete viewer data
    useEffect(() => {
        const resolveNames = async () => {
            const uidsToResolve = mergedViewers
                .filter(v => !v.displayName || v.displayName === 'User' || v.displayName === 'Legacy User' || v.displayName === 'Unknown User')
                .map(v => v.uid);

            if (uidsToResolve.length > 0 && !loadingViewers) {
                setLoadingViewers(true);
                try {
                    const resolvedUsers = await getUsersByIds(uidsToResolve);
                    setAllUsers(prev => {
                        // Merge with existing users in state
                        const userMap = new Map();
                        prev.forEach(u => userMap.set(u.uid, u));
                        resolvedUsers.forEach(u => userMap.set(u.uid, u));
                        return Array.from(userMap.values());
                    });
                } catch (error) {
                    console.error('Error resolving viewer names:', error);
                } finally {
                    setLoadingViewers(false);
                }
            }
        };

        if (mergedViewers.length > 0) {
            resolveNames();
        }
    }, [mergedViewers.length]);

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!currentNotice) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <h2 className="text-2xl font-bold">Notice Not Found</h2>
                    <p className="text-muted-foreground">The notice you are looking for does not exist or has been removed.</p>
                    <Button onClick={() => navigate('/notices')}>Back to Notices</Button>
                </div>
            </Layout>
        );
    }

    const categoryInfo = NOTICE_CATEGORIES.find((c) => c.value === currentNotice.category);
    const categoryColorClass = getCategoryColor(currentNotice.category);

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="pl-0 hover:pl-2 transition-all"
                    onClick={() => navigate('/notices')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Notices
                </Button>

                {/* Navigation Buttons (Top) */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        disabled={!prevNotice}
                        onClick={() => prevNotice && navigate(`/notices/${prevNotice.id}`)}
                        className="w-[120px] justify-start"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        disabled={!nextNotice}
                        onClick={() => nextNotice && navigate(`/notices/${nextNotice.id}`)}
                        className="w-[120px] justify-end"
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>

                {/* Main Content Card */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-8 pb-4 border-b">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className={`category-badge border ${categoryColorClass} px-3 py-1 text-sm`}>
                                <Tag className="h-3.5 w-3.5 mr-1.5" />
                                {categoryInfo?.label || currentNotice.category}
                            </Badge>
                            {currentNotice.department && (
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    <Building className="h-3.5 w-3.5 mr-1.5" />
                                    {currentNotice.department}
                                </Badge>
                            )}
                            {currentNotice.isPinned && (
                                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-sm px-3 py-1">
                                    Pinned
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight text-foreground mb-4">
                            {currentNotice.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {currentNotice.createdByName}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(currentNotice.createdAt, 'PPP')}
                            </span>
                            <span className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <button
                                            id="view-count-trigger"
                                            className="hover:underline cursor-pointer decoration-dotted underline-offset-4 outline-none"
                                        >
                                            {mergedViewers.length} views
                                        </button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                                        <SheetHeader className="p-6 border-b shrink-0">
                                            <SheetTitle className="flex items-center gap-2">
                                                <UsersIcon className="h-5 w-5 text-primary" />
                                                View Information
                                            </SheetTitle>
                                            <SheetDescription>
                                                Detailed list of users who have viewed this notice and their viewing time.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <div className="p-6 bg-muted/30 border-b space-y-4 shrink-0">
                                            <div>
                                                <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Notice Audience</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentNotice.visibleTo.map(role => (
                                                        <Badge key={role} variant="outline" className="capitalize bg-background">
                                                            {role}
                                                        </Badge>
                                                    ))}
                                                    {currentNotice.department && (
                                                        <Badge variant="outline" className="bg-background">
                                                            {currentNotice.department} Dept.
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <ScrollArea className="flex-1">
                                            <div className="p-0">
                                                {(userData?.role === 'admin' || userData?.role === 'teacher') ? (
                                                    <div className="divide-y">
                                                        {mergedViewers && mergedViewers.length > 0 ? (
                                                            mergedViewers.map((view) => {
                                                                const displayName = view.displayName || 'User ' + (view.uid?.substring(0, 5) || '???');
                                                                return (
                                                                    <div key={`${view.uid}-${view.seenAt.getTime()}`} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                                                                        <Avatar className="h-10 w-10 shrink-0">
                                                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                                                {displayName[0] || 'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between mb-0.5">
                                                                                <p className="font-semibold text-sm truncate">{displayName}</p>
                                                                                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                                                                                    {view.role || 'User'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                                                <Calendar className="h-3 w-3" />
                                                                                {format(view.seenAt, "MMM d, h:mm a")}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="px-6 py-12 text-center text-muted-foreground">
                                                                {loadingViewers ? (
                                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                                                                ) : (
                                                                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                                )}
                                                                <p>{loadingViewers ? 'Loading viewer details...' : 'No views recorded yet'}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-12 text-center text-muted-foreground">
                                                        <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                        <p className="text-sm">Detailed view counts are available for Teachers and Admins only.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </SheetContent>
                                </Sheet>
                            </span>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="prose prose-lg max-w-none dark:prose-invert">
                            <p className="whitespace-pre-wrap leading-relaxed">
                                {currentNotice.description}
                            </p>
                        </div>

                        {currentNotice.attachmentUrl && (
                            <div className="mt-10 rounded-xl border bg-muted/30 p-6">
                                <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Attachment
                                </h4>

                                {currentNotice.attachmentType === 'image' ? (
                                    <div className="space-y-4">
                                        <img
                                            src={currentNotice.attachmentUrl}
                                            alt={currentNotice.attachmentName || 'Attachment'}
                                            className="rounded-lg border w-full object-contain bg-background max-h-[80vh]"
                                        />
                                        <div className="flex justify-end">
                                            <Button asChild variant="outline">
                                                <a href={currentNotice.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    View Full Quality
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-base truncate">
                                                    {currentNotice.attachmentName || 'Document'}
                                                </p>
                                                <p className="text-xs text-muted-foreground uppercase font-medium mt-1">PDF Document</p>
                                            </div>
                                        </div>
                                        <Button asChild size="lg" variant="default">
                                            <a href={currentNotice.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Buttons (Bottom) */}
                <div className="flex items-center justify-between pb-10">
                    <Button
                        variant="outline"
                        disabled={!prevNotice}
                        onClick={() => prevNotice && navigate(`/notices/${prevNotice.id}`)}
                        className="w-[140px]"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        disabled={!nextNotice}
                        onClick={() => nextNotice && navigate(`/notices/${nextNotice.id}`)}
                        className="w-[140px]"
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default NoticeDetailPage;
