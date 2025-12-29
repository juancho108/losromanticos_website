import React, { useState } from 'react';
import { Member } from '../types';

interface MemberCardProps {
    member: Member;
    onFlip: () => void;
    style?: React.CSSProperties;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onFlip, style }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleInteraction = () => {
        if (!isFlipped) {
            setIsFlipped(true);
            onFlip();
        } else {
            setIsFlipped(false);
        }
    };

    return (
        <div 
            className="group w-full aspect-[3/5] perspective-1000 cursor-pointer animate-float"
            onClick={handleInteraction}
            style={style}
        >
            <div className={`relative w-full h-full duration-700 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* FRONT */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-sm border border-[#D4AF37]/30 bg-[#0a0a0a] flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                    {/* Decorative Background Element */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/20 to-transparent"></div>
                    
                    <span className="text-6xl md:text-8xl opacity-80 select-none transform group-hover:scale-110 transition-transform duration-500">{member.instrumentIcon}</span>
                    
                    <div className="mt-8 flex flex-col items-center gap-2 relative z-10">
                        <div className="w-[1px] h-8 bg-[#D4AF37]"></div>
                        <p className="font-['Anton'] text-[10px] md:text-sm tracking-[0.4em] text-[#D4AF37] uppercase">
                            DESCUBRIR
                        </p>
                    </div>

                    <div className="absolute bottom-6 w-full text-center">
                         <p className="font-['Montserrat'] text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-white/30">Los Románticos • Staff</p>
                    </div>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-sm border border-[#E91E63]/40 bg-[#080808] p-3 md:p-4 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                    
                    {/* 1:1 PHOTO AREA */}
                    <div className="w-full aspect-square relative overflow-hidden mb-3 border border-white/10">
                        <img 
                            src={member.image} 
                            alt={member.name} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                    
                    {/* INFO AREA */}
                    <div className="flex flex-col flex-1 justify-between">
                        
                        {/* Header */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-[#D4AF37] text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] truncate mr-2">{member.role}</p>
                                <span className="text-xs opacity-50">{member.instrumentIcon}</span>
                            </div>
                            
                            <h3 className="font-['Anton'] text-xl md:text-3xl uppercase leading-none text-white tracking-wide mb-1 truncate">{member.name}</h3>
                            <div className="w-full h-[1px] bg-gradient-to-r from-[#E91E63] to-transparent opacity-50"></div>
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-1 md:space-y-3 py-1 md:py-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <p className="text-[7px] md:text-[9px] text-gray-500 uppercase font-bold tracking-widest">Estilo</p>
                                <p className="text-[8px] md:text-[10px] font-bold text-gray-200 text-right truncate">{member.style}</p>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <p className="text-[7px] md:text-[9px] text-gray-500 uppercase font-bold tracking-widest">Influencias</p>
                                <p className="text-[8px] md:text-[10px] font-bold text-[#E91E63] text-right truncate">{member.influences}</p>
                            </div>
                        </div>

                        {/* Footer decorative */}
                        <div className="flex justify-center pt-2 border-t border-white/5">
                            <span className="text-[6px] md:text-[8px] text-gray-600 uppercase tracking-[0.4em]">Official Member</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberCard;