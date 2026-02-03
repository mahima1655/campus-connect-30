import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getAllUsers } from '@/services/userService';
import { User } from '@/types';

interface UserSelectProps {
    id?: string;
    selectedUids: string[];
    onChange: (uids: string[]) => void;
    allowedRoles?: string[];
}

const UserSelect: React.FC<UserSelectProps> = ({ id, selectedUids, onChange, allowedRoles }) => {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const allUsers = await getAllUsers();
                // Filter by allowed roles if provided
                const filtered = allowedRoles && allowedRoles.length > 0
                    ? allUsers.filter(u => allowedRoles.includes(u.role))
                    : allUsers;
                setUsers(filtered);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [allowedRoles]);

    const handleSelect = (uid: string) => {
        const newSelected = selectedUids.includes(uid)
            ? selectedUids.filter((id) => id !== uid)
            : [...selectedUids, uid];
        onChange(newSelected);
    };

    const selectedUsers = users.filter((u) => selectedUids.includes(u.uid));

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between hover:bg-background"
                    >
                        <span className="truncate">
                            {selectedUids.length === 0
                                ? "Select specific users..."
                                : `${selectedUids.length} user(s) selected`}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                                {users.map((user) => (
                                    <CommandItem
                                        key={user.uid}
                                        value={`${user.displayName} ${user.email}`}
                                        onSelect={() => handleSelect(user.uid)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedUids.includes(user.uid) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{user.displayName}</span>
                                            <span className="text-xs text-muted-foreground">{user.role} • {user.email}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {selectedUsers.map((user) => (
                        <Badge key={user.uid} variant="secondary" className="flex items-center gap-1 py-1">
                            {user.displayName}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => handleSelect(user.uid)}
                            />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserSelect;
