import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Notice } from '@/types';
import Layout from '@/components/Layout';
import NoticeForm from '@/components/NoticeForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CreateNotice: React.FC = () => {
  const { userData } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const handleSuccess = () => {
    setSuccessCount((prev) => prev + 1);
    toast.success('Notice created successfully!');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Create Notice</h1>
          <p className="text-muted-foreground mt-1">
            Post new announcements for students and staff
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Create Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setFormOpen(true)}>
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">New Notice</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new announcement for the college community
              </p>
              <Button>Create Now</Button>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Your Activity</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {successCount > 0 
                  ? `You've created ${successCount} notice${successCount > 1 ? 's' : ''} this session`
                  : 'Start posting notices to track your activity'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips for Effective Notices</CardTitle>
            <CardDescription>Make your announcements clear and impactful</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Use clear, descriptive titles</p>
                  <p className="text-sm text-muted-foreground">Help readers understand the notice at a glance</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Select the right category</p>
                  <p className="text-sm text-muted-foreground">Proper categorization helps users find relevant notices</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Pin important announcements</p>
                  <p className="text-sm text-muted-foreground">Pinned notices stay at the top for maximum visibility</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">Attach relevant documents</p>
                  <p className="text-sm text-muted-foreground">Include PDFs or images for detailed information</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <NoticeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
};

export default CreateNotice;
