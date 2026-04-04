import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface HackathonTimelineTableProps {
    hackathon: any;
}

export function HackathonTimelineTable({ hackathon }: HackathonTimelineTableProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'TBD';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'TBD';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '--:--';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const timelineEvents = [
        {
            phase: 'Registration Phase',
            start: hackathon.registrationStart,
            end: hackathon.registrationEnd,
            description: 'Enlistment for the hackathon'
        },
        {
            phase: 'Mentor Selection',
            start: hackathon.mentorSelectionStart,
            end: hackathon.mentorSelectionEnd,
            description: 'Archons choose their squads'
        },
        {
            phase: 'Squad Approval',
            start: hackathon.approvalStart,
            end: hackathon.approvalEnd,
            description: 'Final clearance for deployment'
        }
    ];

    // Add individual rounds to timeline
    if (hackathon.rounds && Array.isArray(hackathon.rounds)) {
        const sortedRounds = [...hackathon.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
        sortedRounds.forEach((round) => {
            timelineEvents.push({
                phase: `Round ${round.roundNumber}: ${round.title}`,
                start: round.startDate,
                end: round.endDate,
                description: round.description || 'Combat round execution'
            });
        });
    }

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl my-8">
            <div className="p-8 border-b border-zinc-800/50 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <Calendar className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Master Timeline</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Operational Schedule</p>
                </div>
            </div>
            <div className="overflow-x-auto scroller-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900/80 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                            <th className="px-8 py-6 w-1/3">Phase / Event</th>
                            <th className="px-8 py-6 text-center">Start Date & Time</th>
                            <th className="px-8 py-6 text-center">End Date & Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {timelineEvents.map((event, idx) => (
                            <tr key={idx} className="hover:bg-zinc-800/20 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors">{event.phase}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">{event.description}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 group-hover:border-indigo-500/30 transition-colors">
                                        <span className="text-xs font-black text-white whitespace-nowrap">{formatDate(event.start)}</span>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatTime(event.start)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 group-hover:border-indigo-500/30 transition-colors">
                                        <span className="text-xs font-black text-white whitespace-nowrap">{formatDate(event.end)}</span>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatTime(event.end)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
