'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, Star, Crown, Lock, Zap, ArrowRight, Users, UserPlus, Search, Check, Copy, Trash2, X, Swords, Share2, Sparkles
} from 'lucide-react';

const getInitialLeaderboardCache = () => {
  if (typeof window !== 'undefined' && (window as any).__LEADERBOARD_CACHE__) {
    return (window as any).__LEADERBOARD_CACHE__;
  }
  return null;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const initialCache = getInitialLeaderboardCache();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  
  // Global Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>(initialCache?.leaderboard || []);
  const [userRank, setUserRank] = useState<any>(initialCache?.userRank || null);
  const [loadingGlobal, setLoadingGlobal] = useState(!initialCache);

  // Friends Leaderboard State
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Global Leaderboard
  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const cacheObj = {
            leaderboard: data.leaderboard || [],
            userRank: data.userRank || null,
          };
          if (typeof window !== 'undefined') {
            (window as any).__LEADERBOARD_CACHE__ = cacheObj;
          }
          setLeaderboard(data.leaderboard || []);
          setUserRank(data.userRank || null);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingGlobal(false));
  }, []);

  // Fetch Friends Leaderboard
  const fetchFriendsLeaderboard = () => {
    setLoadingFriends(true);
    fetch('/api/leaderboard/friends')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setFriendsList(data.friendsLeaderboard || []);
          if (data.inviteCode) setInviteCode(data.inviteCode);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingFriends(false));
  };

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriendsLeaderboard();
    }
  }, [activeTab]);

  // Search Registered Students
  useEffect(() => {
    if (!searchQuery.trim() || !showInviteModal) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/leaderboard/friends?search=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.searchResults || []);
        })
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showInviteModal]);

  // Add Friend Handler
  const handleAddFriend = async (friendId: string) => {
    setAddingFriendId(friendId);
    try {
      const res = await fetch('/api/leaderboard/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Friend added successfully!');
        setSearchResults((prev) =>
          prev.map((item) => (item.id === friendId ? { ...item, isAlreadyFriend: true } : item))
        );
        fetchFriendsLeaderboard();
      } else {
        showToast(data.error || 'Failed to add friend');
      }
    } catch {
      showToast('Error adding friend');
    } finally {
      setAddingFriendId(null);
    }
  };

  // Remove Friend Handler
  const handleRemoveFriend = async (friendId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your custom friends leaderboard?`)) return;
    try {
      const res = await fetch(`/api/leaderboard/friends?friendId=${friendId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Removed ${name} from friends`);
        fetchFriendsLeaderboard();
      }
    } catch {
      showToast('Failed to remove friend');
    }
  };

  // Copy Shareable Invite Link
  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/leaderboard?joinCode=${inviteCode || 'INVITE'}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('📋 Friend invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Challenge Friend Action
  const handleChallengeFriend = (friendName: string) => {
    const challengeMsg = `Hey ${friendName}! I challenge you to compete on ExamMaster! Check my XP on our custom leaderboard: ${window.location.origin}/leaderboard`;
    navigator.clipboard.writeText(challengeMsg);
    showToast(`⚔️ Challenge link copied for ${friendName}! Send it to them now.`);
  };

  // Leaderboard is locked when the current user has 0 XP
  const isLocked = !loadingGlobal && userRank !== null && (userRank.xp_total === 0 || !userRank.xp_total);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {toastMessage}
        </div>
      )}

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1 animate-page-in pb-24 lg:pb-0">

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-900/50">
                <Trophy className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Leaderboard &amp; Student Standings
                </h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Track live course rankings or compete with your study buddies in your custom friends arena!
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA: Invite Friends Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xs"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-blue-600" />}
              {copiedLink ? 'Link Copied!' : 'Share Invite Link'}
            </button>

            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Invite Friends
            </button>
          </div>
        </div>

        {/* Pinned Own Rank Card */}
        {userRank && (
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/40 p-6 text-slate-900 dark:text-white shadow-xs">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md">
                  #{userRank.rank}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    YOUR OFFICIAL COURSE RANKING
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{userRank.name}</h3>
                </div>
              </div>

              <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-2xl font-black text-xl flex items-center gap-2 border border-blue-200/80 dark:border-blue-900">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                {userRank.xp_total?.toLocaleString() || 0} XP
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs Switcher: Global Course vs Custom Friends Arena */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'global'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Course Standings (Global)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Custom Friends Arena
            {friendsList.length > 1 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'friends' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {friendsList.length - 1}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Global Course Leaderboard Table */}
        {activeTab === 'global' && (
          <div className="relative">
            <div
              className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all duration-500 ${
                isLocked ? 'blur-sm pointer-events-none select-none' : ''
              }`}
              aria-hidden={isLocked}
            >
              {loadingGlobal ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400">Loading course leaderboard...</div>
              ) : leaderboard.length === 0 ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400">No student rankings recorded yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4 pl-6 w-20 text-center">Rank</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4 pr-6 text-right">Total XP Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                    {leaderboard.map((student) => (
                      <tr
                        key={student.rank}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          student.isSelf ? 'bg-blue-50/60 dark:bg-blue-950/30 font-bold' : ''
                        }`}
                      >
                        <td className="p-4 pl-6 text-center font-bold">
                          {student.rank === 1 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                              <Crown className="w-4 h-4 fill-current" />
                            </span>
                          ) : student.rank === 2 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black shadow-xs">
                              2
                            </span>
                          ) : student.rank === 3 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-700 text-white flex items-center justify-center font-black shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="font-extrabold text-slate-400">#{student.rank}</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {student.name}
                          {student.isSelf && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right font-black text-slate-900 dark:text-white text-sm">
                          {student.xp_total?.toLocaleString() || 0} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Locked Overlay for 0 XP Users */}
            {isLocked && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
                style={{ background: 'rgba(248,250,252,0.55)', backdropFilter: 'blur(2px)' }}
              >
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30">
                      <Lock className="w-9 h-9 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 animate-ping" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 tracking-wider">
                      Leaderboard Locked
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mt-3 leading-tight">
                      Earn your first XP<br />to unlock rankings
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      The leaderboard is only visible to students who have earned at least <span className="font-black text-amber-600">1 XP</span>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push('/practice')}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Go Practice &amp; Earn XP <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Custom Friends Leaderboard Arena */}
        {activeTab === 'friends' && (
          <div className="space-y-6">
            
            {/* Friends Leaderboard Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Custom Friends Arena Standings
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Compare progress, track XP, and challenge your study partners.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite More Friends
                </button>
              </div>

              {loadingFriends ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400">Loading custom friends arena...</div>
              ) : friendsList.length <= 1 ? (
                /* Empty Friends Arena State */
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900">
                    <Users className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Your Custom Arena is empty!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Invite your friends or classmates who have an account on ExamMaster to compete together, compare scores, and boost preparation!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> Invite First Friend Now
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4 pl-6 w-20 text-center">Arena Rank</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4 text-center">Total XP</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                    {friendsList.map((friend) => (
                      <tr
                        key={friend.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          friend.isSelf ? 'bg-blue-50/60 dark:bg-blue-950/30 font-bold' : ''
                        }`}
                      >
                        <td className="p-4 pl-6 text-center font-bold">
                          {friend.rank === 1 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                              👑 1
                            </span>
                          ) : (
                            <span className="font-extrabold text-slate-500">#{friend.rank}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{friend.name}</span>
                            {friend.isSelf ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                YOU
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                FRIEND
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{friend.email}</span>
                        </td>

                        <td className="p-4 text-center font-black text-slate-900 dark:text-white text-sm">
                          {friend.xp_total?.toLocaleString() || 0} XP
                        </td>

                        <td className="p-4 pr-6 text-right">
                          {friend.isSelf ? (
                            <span className="text-[11px] text-slate-400 font-bold">Host</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleChallengeFriend(friend.name)}
                                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1 transition-colors"
                              >
                                <Swords className="w-3.5 h-3.5" /> Challenge
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                title="Remove friend from custom arena"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Invite Friends to Custom Arena</h3>
                  <p className="text-[11px] text-slate-500">Add registered students or share invite link</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input for Registered Users */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Search Registered Students (Name or Email)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Ram or student@gmail.com..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Search Results Container */}
            {searching ? (
              <div className="py-6 text-center text-xs font-bold text-slate-400">Searching students...</div>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs font-semibold text-slate-400">
                No matching student account found. Try searching by full email!
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-800/30">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{user.email} · {user.xp_total} XP</p>
                    </div>

                    {user.isAlreadyFriend ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px] rounded-lg flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddFriend(user.id)}
                        disabled={addingFriendId === user.id}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {addingFriendId === user.id ? 'Adding...' : 'Add Friend'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Share Invite Code Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Shareable Arena Link
              </span>
              <p className="text-[11px] text-slate-500">
                Send this link to friends so they can join your custom arena standings:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={inviteCode ? `${window.location.origin}/leaderboard?joinCode=${inviteCode}` : 'Loading code...'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Done
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
