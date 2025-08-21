


import React, { useState } from 'react';
import { Contributor, UserRole } from '../types';
import { BoundingBox } from './BoundingBox';

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    contributors: Contributor[];
    onUpdateContributors: (newContributors: Contributor[]) => void;
    currentUser: string;
}

const ROLES: UserRole[] = ['Project Leader', 'Proofreader 1', 'Proofreader 2', 'Translator'];

const RoleCheckboxes: React.FC<{
    username: string;
    userRoles: UserRole[];
    onRoleChange: (username: string, role: UserRole) => void;
    disabled: boolean;
}> = ({ username, userRoles, onRoleChange, disabled }) => {
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
            {ROLES.map(role => (
                <label key={role} className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={userRoles.includes(role)}
                        onChange={() => onRoleChange(username, role)}
                        disabled={disabled}
                        className="form-checkbox h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <span className={disabled ? 'text-slate-500' : 'text-slate-700'}>{role}</span>
                </label>
            ))}
        </div>
    );
};


export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, contributors, onUpdateContributors, currentUser }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newRoles, setNewRoles] = useState<UserRole[]>(['Translator']);

    if (!isOpen) return null;

    const handleRoleChange = (username: string, role: UserRole) => {
        let newContributors = [...contributors];
        const exclusiveRoles: UserRole[] = ['Project Leader', 'Proofreader 1', 'Proofreader 2'];

        if (exclusiveRoles.includes(role)) {
            const isAddingRole = !contributors.find(c => c.githubUsername === username)?.roles.includes(role);
            if (isAddingRole) {
                // Unassign this exclusive role from any other user who might have it
                newContributors = newContributors.map(c => {
                    if (c.roles.includes(role)) {
                        return { ...c, roles: c.roles.filter(r => r !== role) };
                    }
                    return c;
                });
            }
        }

        newContributors = newContributors.map(c => {
            if (c.githubUsername === username) {
                // Prevent removing the last role
                if (c.roles.includes(role) && c.roles.length === 1) {
                    alert("A user must have at least one role.");
                    return c;
                }
                const updatedRoles = c.roles.includes(role)
                    ? c.roles.filter(r => r !== role)
                    : [...c.roles, role];
                return { ...c, roles: updatedRoles };
            }
            return c;
        });
        onUpdateContributors(newContributors);
    };

    const handleRemove = (username: string) => {
        if (window.confirm(`Are you sure you want to remove ${username}?`)) {
            const newContributors = contributors.filter(c => c.githubUsername !== username);
            onUpdateContributors(newContributors);
        }
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;
        if (newRoles.length === 0) {
            alert("Please assign at least one role to the new user.");
            return;
        }

        if (contributors.some(c => c.githubUsername.toLowerCase() === newUsername.trim().toLowerCase())) {
            alert(`User "${newUsername.trim()}" is already a contributor.`);
            return;
        }

        let updatedContributors = [...contributors];
        const exclusiveRoles: UserRole[] = ['Project Leader', 'Proofreader 1', 'Proofreader 2'];
        
        exclusiveRoles.forEach(role => {
            if(newRoles.includes(role)) {
                updatedContributors = updatedContributors.map(c => {
                    if (c.roles.includes(role)) {
                        return {...c, roles: c.roles.filter(r => r !== role)};
                    }
                    return c;
                })
            }
        });

        onUpdateContributors([...updatedContributors, { githubUsername: newUsername.trim(), roles: newRoles }]);
        setNewUsername('');
        setNewRoles(['Translator']);
    };
    
    const handleNewUserRoleChange = (role: UserRole) => {
        setNewRoles(prev => {
            const isPresent = prev.includes(role);
            if (isPresent) {
                // Don't allow removing the last role
                return prev.length > 1 ? prev.filter(r => r !== role) : prev;
            } else {
                return [...prev, role];
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onMouseDown={onClose}>
            <BoundingBox name="user management modal" className="!m-0 max-w-3xl w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[80vh]" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">Manage Users</h2>
                        <p className="text-sm text-slate-500 mt-1">Invite, remove, and change roles for project contributors.</p>
                    </div>

                    <div className="flex-grow p-6 overflow-y-auto space-y-4">
                        {/* User List */}
                        <div className="space-y-3">
                            {contributors.map(user => {
                                const isOwner = user.roles.includes('Owner');
                                return (
                                    <div key={user.githubUsername} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 rounded-md gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800">{user.githubUsername}</span>
                                            {isOwner && <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Owner</span>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <RoleCheckboxes 
                                                username={user.githubUsername}
                                                userRoles={user.roles}
                                                onRoleChange={handleRoleChange}
                                                disabled={isOwner}
                                            />
                                            {!isOwner && user.githubUsername !== currentUser && (
                                                <button onClick={() => handleRemove(user.githubUsername)} className="p-1 text-slate-500 hover:text-red-600" title="Remove user">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Invite Form */}
                        <form onSubmit={handleInvite} className="pt-4 border-t border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Invite New Contributor</h3>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={e => setNewUsername(e.target.value)}
                                    placeholder="GitHub username"
                                    className="flex-grow p-2 border border-slate-300 rounded-md w-full sm:w-auto"
                                />
                                <div className="flex-shrink-0 p-2 border border-slate-200 rounded-md bg-white">
                                    <RoleCheckboxes 
                                        username="new-user"
                                        userRoles={newRoles}
                                        onRoleChange={(_, role) => handleNewUserRoleChange(role)}
                                        disabled={false}
                                    />
                                </div>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Invite</button>
                            </div>
                        </form>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">
                            Close
                        </button>
                    </div>
                </div>
            </BoundingBox>
        </div>
    );
};