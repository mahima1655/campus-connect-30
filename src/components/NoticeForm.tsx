import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Notice, NoticeCategory, NOTICE_CATEGORIES, DEPARTMENTS, VisibleTo } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createNotice, updateNotice } from '@/services/noticeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import UserSelect from './UserSelect';

const noticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  customCategory: z.string().optional(),
  department: z.string().optional(),
  visibleTo: z.array(z.string()).min(1, 'Select at least one visibility option'),
  targetUids: z.array(z.string()).optional(),
  isPinned: z.boolean(),
  expiryDate: z.date().optional(),
}).refine((data) => {
  if (data.category === 'other' && (!data.customCategory || data.customCategory.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please enter a custom category name",
  path: ["customCategory"],
});

type NoticeFormData = z.infer<typeof noticeSchema>;

interface NoticeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNotice?: Notice | null;
  onSuccess?: () => void;
}

const NoticeForm: React.FC<NoticeFormProps> = ({
  open,
  onOpenChange,
  editingNotice,
  onSuccess,
}) => {
  const { userData } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: editingNotice?.title || '',
      description: editingNotice?.description || '',
      category: editingNotice?.category || '',
      customCategory: '',
      department: editingNotice?.department || '',
      visibleTo: editingNotice?.visibleTo || ['student', 'teacher', 'admin'],
      targetUids: editingNotice?.targetUids || [],
      isPinned: editingNotice?.isPinned || false,
      expiryDate: editingNotice?.expiryDate,
    },
  });

  const selectedCategory = form.watch('category');
  const visibleTo = form.watch('visibleTo');

  React.useEffect(() => {
    if (editingNotice) {
      form.reset({
        title: editingNotice.title,
        description: editingNotice.description,
        category: editingNotice.category,
        customCategory: '',
        department: editingNotice.department || '',
        visibleTo: editingNotice.visibleTo,
        targetUids: editingNotice.targetUids || [],
        isPinned: editingNotice.isPinned,
        expiryDate: editingNotice.expiryDate,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        category: '',
        customCategory: '',
        department: '',
        visibleTo: ['student', 'teacher', 'admin'],
        targetUids: [],
        isPinned: false,
        expiryDate: undefined,
      });
    }
  }, [editingNotice, form]);

  const onSubmit = async (data: NoticeFormData) => {
    console.log('NoticeForm: onSubmit started', data);
    if (!userData) {
      console.log('NoticeForm: No userData available');
      toast.error('You must be logged in to create a notice');
      return;
    }

    setIsSubmitting(true);
    try {
      const noticeData = {
        title: data.title,
        description: data.description,
        category: data.category === 'other' ? data.customCategory! : data.category,
        department: (data.department && data.department !== 'none') ? data.department : undefined,
        visibleTo: data.visibleTo as VisibleTo[],
        targetUids: data.targetUids,
        isPinned: data.isPinned,
        expiryDate: data.expiryDate,
        createdBy: userData.uid,
        createdByName: userData.displayName || userData.email || 'Unknown',
        isApproved: true,
      };

      console.log('NoticeForm: Calling service with data:', noticeData);
      if (editingNotice) {
        console.log('NoticeForm: calling updateNotice');
        await updateNotice(editingNotice.id, noticeData, file || undefined);
        console.log('NoticeForm: updateNotice success');
        toast.success('Notice updated successfully');
      } else {
        console.log('NoticeForm: calling createNotice');
        await createNotice(noticeData, file || undefined);
        console.log('NoticeForm: createNotice success');
        toast.success('Notice created successfully');
      }

      form.reset();
      setFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('NoticeForm Error saving notice:', error);
      toast.error('Failed to save notice. check if Cloudinary credentials are set in .env');
    } finally {
      console.log('NoticeForm: finally block - setIsSubmitting(false)');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {editingNotice ? 'Edit Notice' : 'Create New Notice'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to {editingNotice ? 'update the' : 'create a new'} notice.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="notice-title">Title</FormLabel>
                  <FormControl>
                    <Input
                      id="notice-title"
                      name="title"
                      placeholder="Enter notice title"
                      {...field}
                      className="input-focus"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="notice-description">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      id="notice-description"
                      name="description"
                      placeholder="Enter notice description"
                      rows={4}
                      {...field}
                      className="input-focus resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="notice-category">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="notice-category" className="input-focus">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NOTICE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other (Dynamic)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCategory === 'other' && (
                <FormField
                  control={form.control}
                  name="customCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="custom-category">Custom Category Name</FormLabel>
                      <FormControl>
                        <Input
                          id="custom-category"
                          placeholder="Enter new category name"
                          {...field}
                          className="input-focus"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="notice-department">Department (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="notice-department" className="input-focus">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel htmlFor="notice-expiry-trigger">Expiry Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          id="notice-expiry-trigger"
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal input-focus',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibleTo"
              render={() => (
                <FormItem>
                  <FormLabel id="label-visible-to">Visible To</FormLabel>
                  <div className="flex flex-wrap gap-4" aria-labelledby="label-visible-to">
                    {['student', 'teacher', 'admin'].map((role) => (
                      <FormField
                        key={role}
                        control={form.control}
                        name="visibleTo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                id={`visible-to-${role}`}
                                checked={field.value?.includes(role)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, role])
                                    : field.onChange(field.value?.filter((val: string) => val !== role));
                                }}
                              />
                            </FormControl>
                            <FormLabel htmlFor={`visible-to-${role}`} className="font-normal capitalize cursor-pointer">
                              {role}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(userData?.role === 'admin' || userData?.role === 'teacher') && (
              <FormField
                control={form.control}
                name="targetUids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="target-uids-select">Target Specific Users (Optional)</FormLabel>
                    <FormControl>
                      <UserSelect
                        id="target-uids-select"
                        selectedUids={field.value || []}
                        onChange={field.onChange}
                        allowedRoles={visibleTo}
                      />
                    </FormControl>
                    <p className="text-[0.8rem] text-muted-foreground">
                      If users are selected, only they (and admins) will see this notice.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="notice-pinned"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="notice-pinned" className="cursor-pointer">Pin this notice</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel htmlFor="file-upload">Attachment (Optional)</FormLabel>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : 'Click to upload PDF or Image'}
                  </p>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingNotice ? 'Update Notice' : 'Create Notice'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NoticeForm;
