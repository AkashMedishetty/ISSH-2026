'use client';

import Image from 'next/image';

interface Member {
  name: string;
  role?: string;
  initials: string;
  image?: string;
}

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#ebc975] to-[#852016] flex items-center justify-center overflow-hidden border-2 border-[#ebc975]/60 shadow-md">
        {member.image ? (
          <Image src={member.image} alt={member.name} width={80} height={80} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm md:text-lg font-bold text-white">{member.initials}</span>
        )}
      </div>
      <p className="text-[9px] md:text-xs font-semibold text-[#25406b] leading-tight mt-1">{member.name}</p>
      {member.role && <p className="text-[8px] md:text-[10px] text-[#852016]">{member.role}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[9px] md:text-[11px] font-bold text-[#852016] mb-2 md:mb-3 text-center uppercase tracking-wide">
        {title}
      </h4>
      <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
        {children}
      </div>
    </div>
  );
}

export function CommitteeContent() {
  const isshBearers: Member[] = [
    { name: 'Dr G Karthikeyan', role: 'President', initials: 'GK', image: '/ISSH/karthikeyan.jpg' },
    { name: 'Dr Praveen Bhardwaj', role: 'Secretary', initials: 'PB', image: '/ISSH/praveen.jpg' },
    { name: 'Dr. Anil K Bhat', role: 'President Elect', initials: 'AB', image: '/ISSH/Anil-Bhat.jpg' },
  ];
  
  const tosaBearers: Member[] = [
    { name: 'Dr K Ram Kumar Reddy', role: 'President', initials: 'RK', image: '/ISSH/Ram kumar.jpg' },
    { name: 'Dr Jagan Mohan Reddy', role: 'Secretary', initials: 'JM', image: '/ISSH/jagan.jpg' },
    { name: 'Dr Alwal Reddy', role: 'President Elect', initials: 'AR', image: '/ISSH/alwal.jpg' },
  ];
  
  const tcosBearers: Member[] = [
    { name: 'Dr Raju Iyenger', role: 'President', initials: 'RI', image: '/ISSH/raju.jpg' },
    { name: 'Dr Suneel R', role: 'Secretary', initials: 'SR', image: '/ISSH/suneel.jpg' },
  ];

  const orgChairs: Member[] = [
    { name: 'Prof MV Reddy', role: 'Organising Chairman', initials: 'MR', image: '/ISSH/mv reddy.jpg' },
    { name: 'Dr Gopinath Bandari', role: 'Organising Secretary', initials: 'GB', image: '/ISSH/gopi.png' },
    { name: 'Dr Sandeep Sriram', role: 'Treasurer', initials: 'SS', image: '/ISSH/sandeep sriram.jpeg' },
  ];

  const scientific: Member[] = [
    { name: 'Dr Deepthinandan Reddy', initials: 'DR', image: '/ISSH/deepthinandan.jpeg' },
    { name: 'Dr Suneel R', initials: 'SR', image: '/ISSH/suneel.jpg' },
    { name: 'Dr Manesh Jain', initials: 'MJ', image: '/ISSH/manish.jpeg' },
  ];
  
  const trade: Member[] = [
    { name: 'Dr Sandeep Sriram', initials: 'SS', image: '/ISSH/sandeep sriram.jpeg' },
    { name: 'Dr Sujit Kumar Vakati', initials: 'SV', image: '/ISSH/sujit.jpeg' },
  ];
  
  const travel: Member[] = [
    { name: 'Dr Avinash', initials: 'AV', image: '/ISSH/Avinash.jpeg' },
    { name: 'Dr Krishna Sandeep', initials: 'KS', image: '/ISSH/krishna sandeep.jpeg' },
  ];
  
  const registration: Member[] = [
    { name: 'Dr Sahithya B', initials: 'SB', image: '/ISSH/sahitya.jpeg' },
    { name: 'Dr Minal', initials: 'DM', image: '/ISSH/minal.jpeg' },
  ];
  
  const food: Member[] = [
    { name: 'Dr Sujit Kumar Vakati', initials: 'SV', image: '/ISSH/sujit.jpeg' },
    { name: 'Dr Akkidas Dheeraj', initials: 'AD', image: '/ISSH/akkidas.jpeg' },
  ];
  
  const banquet: Member[] = [
    { name: 'Dr Sandeep Sriram', initials: 'SS', image: '/ISSH/sandeep sriram.jpeg' },
  ];

  return (
    <div className="w-full h-full flex flex-col px-2 md:px-4 py-1 md:py-2">
      {/* Title */}
      <h2 className="text-base md:text-2xl font-bold text-[#25406b] text-center mb-2 md:mb-3">
        Organising <span className="text-[#852016]">Committee</span>
      </h2>

      {/* Office Bearers Row - 3 columns */}
      <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-2 md:mb-3">
        <Section title="ISSH Office Bearers">
          {isshBearers.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
        <Section title="TOSA Office Bearers">
          {tosaBearers.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
        <Section title="TCOS Office Bearers">
          {tcosBearers.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
      </div>

      {/* Organising Committee */}
      <Section title="Organising Committee">
        {orgChairs.map((m) => <MemberCard key={m.name} member={m} />)}
      </Section>

      {/* Scientific Committee */}
      <div className="mt-2 md:mt-3">
        <Section title="Scientific Committee">
          {scientific.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
      </div>

      {/* Trade Committee */}
      <div className="mt-2 md:mt-3">
        <Section title="Trade Committee">
          {trade.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
      </div>

      {/* Travel & Accommodation */}
      <div className="mt-2 md:mt-3">
        <Section title="Travel & Accommodation">
          {travel.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
      </div>

      {/* Registration */}
      <div className="mt-2 md:mt-3">
        <Section title="Registration">
          {registration.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
      </div>

      {/* Food & Beverages + Banquet Incharge - side by side, centered */}
      <div className="mt-2 md:mt-3 flex justify-center gap-8 md:gap-16">
        <Section title="Food & Beverages">
          {food.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
        <Section title="Banquet Incharge">
          {banquet.map((m) => <MemberCard key={m.name} member={m} />)}
        </Section>
      </div>
    </div>
  );
}

export default CommitteeContent;
