import { Briefcase, GraduationCap, Megaphone } from "lucide-react";
import { studentRecruitment } from "@/lib/data";
import { SectionTitle } from "./SectionTitle";

const icons = [GraduationCap, Briefcase, Megaphone];

export function StudentsRecruitment() {
  return (
    <section className="pt-7">
      <SectionTitle title="STUDENTS & RECRUITMENT" />
      <div className="grid grid-cols-3 gap-2 px-4">
        {studentRecruitment.map((item, index) => {
          const Icon = icons[index];
          return (
            <button key={item} className="min-h-28 rounded-[8px] border border-line bg-white p-3 text-left shadow-sm">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-blushSoft text-blush">
                <Icon aria-hidden="true" size={20} />
              </div>
              <p className="text-sm font-black leading-tight text-ink">{item}</p>
              <p className="mt-1 text-[0.68rem] font-bold leading-relaxed text-mute">理容の未来へつなぐ</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
