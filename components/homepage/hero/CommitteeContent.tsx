'use client';

import Image from 'next/image';

interface CommitteeMember {
  name: string;
  role: string;
  organization?: string;
  initials: string;
  image?: string;
}

interface CommitteeGroup {
  title: string;
  members: CommitteeMember[];
}

const committeeData: CommitteeGroup[] = [
  {
    title: 'ISSH Office Bearers',
    members: [
      { name: 'Dr G Karthikeyan', role: 'President', initials: 'GK', image: '/ISSH/karthikeyan.jpg' },
      { name: 'Dr Praveen Bhardwaj', role: 'Secretary', initials: 'PB', image: '/ISSH/praveen.jpg' },
      { name: 'Dr. Anil K Bhat', role: 'President Elect', initials: 'AB', image: '/ISSH/Anil-Bhat.jpg' },
    ],
  },
  {
    title: 'TOSA Office Bearers',
    members: [
      { name: 'Dr K Ram Kumar Reddy', role: 'President', initials: 'RK', image: '/ISSH/Ram kumar.jpg' },
      { name: 'Dr Jagan Mohan Reddy', role: 'Secretary', initials: 'JM', image: '/ISSH/jagan.jpg' },
      { name: 'Dr Alwal Reddy', role: 'President Elect', initials: 'AR', image: '/ISSH/alwal.jpg' },
    ],
  },
  {
    title: 'TCOS Office Bearers',
    members: [
      { name: 'Dr Raju Iyenger', role: 'President', initials: 'RI', image: '/ISSH/raju.jpg' },
      { name: 'Dr Suneel R', role: 'Secretary', initials: 'SR', image: '/ISSH/suneel.jpg' },
    ],
  },
];

const organizingChairs: CommitteeMember[] = [
  {
    name: 'Prof MV Reddy',
    role: 'Organising Chairman',
    organization: 'Kims hospital, Hyderabad',
    initials: 'MR',
    image: '/ISSH/mv reddy.jpg',
  },
  {
    name: 'Dr Gopinath Bandari',
    role: 'Organising Secretary',
    organization: 'Apollo hospital, Jubilee hills, Hyderabad',
    initials: 'GB',
    image: '/ISSH/gopi.png',
  },
];

function MemberCard({ member, size = 'small' }: { member: CommitteeMember; size?: 'small' | 'large' }) {
  const isLarge = size === 'large';
  
  return (
    <div className={`flex ${isLarge ? 'flex-col items-center text-center' : 'items-center gap-3'}`}>
      <div 
        className={`
          ${isLarge ? 'w-16 h-16 md:w-24 md:h-24' : 'w-10 h-10 md:w-14 md:h-14'}
          rounded-full bg-gradient-to-br from-[#ebc975] to-[#852016]
          flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden
        `}
      >
        {member.image ? (
          <Image 
            src={member.image} 
            alt={member.name} 
            width={isLarge ? 96 : 56} 
            height={isLarge ? 96 : 56} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`${isLarge ? 'text-lg md:text-2xl' : 'text-xs md:text-base'} font-bold text-white`}>
            {member.initials}
          </span>
        )}
      </div>
      
      <div className={isLarge ? 'mt-2' : ''}>
        <h4 className={`${isLarge ? 'text-sm md:text-lg' : 'text-xs md:text-sm'} font-bold text-[#25406b]`}>
          {member.name}
        </h4>
        <p className={`${isLarge ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'} text-[#852016] font-medium`}>
          {member.role}
        </p>
        {member.organization && isLarge && (
          <p className="text-[10px] md:text-xs text-[#25406b]/60 mt-0.5">{member.organization}</p>
        )}
      </div>
    </div>
  );
}

export function CommitteeContent() {
  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col px-4 overflow-hidden">
      {/* Section Title */}
      <h2 className="text-xl md:text-4xl font-bold text-[#25406b] text-center pt-4 md:pt-12 mb-3 md:mb-8">
        Organising <span className="text-[#852016]">Committee</span>
      </h2>

      {/* Mobile Layout - Compact, NO SCROLL */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Cards - compact spacing */}
        <div className="space-y-2 pb-2">
          {/* Office Bearers - compact */}
          {committeeData.map((group) => (
            <div key={group.title} className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-[#ebc975]/30">
              <h3 className="text-[10px] font-bold text-[#852016] mb-1.5 pb-1 border-b border-[#ebc975]/30">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.members.map((member) => (
                  <MemberCard key={member.name} member={member} size="small" />
                ))}
              </div>
            </div>
          ))}

          {/* Organizing Chairs - side by side on mobile */}
          <div className="grid grid-cols-2 gap-2">
            {organizingChairs.map((member) => (
              <div key={member.name} className="bg-gradient-to-br from-[#25406b]/10 to-[#852016]/10 backdrop-blur-sm rounded-lg p-2 border border-[#ebc975]/30">
                <MemberCard member={member} size="large" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col md:flex-1">
        {/* Cards */}
        <div className="flex flex-col justify-center flex-1">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {committeeData.map((group) => (
              <div key={group.title} className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-[#ebc975]/20">
                <h3 className="text-sm font-bold text-[#852016] mb-3 pb-2 border-b border-[#ebc975]/30">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.members.map((member) => (
                    <MemberCard key={member.name} member={member} size="small" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-8">
            {organizingChairs.map((member) => (
              <div key={member.name} className="bg-gradient-to-br from-[#25406b]/10 to-[#852016]/10 backdrop-blur-sm rounded-xl p-5 border border-[#ebc975]/30">
                <MemberCard member={member} size="large" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommitteeContent;
