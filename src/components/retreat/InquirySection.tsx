/**
 * "Want to know more?" section for retreat landing pages: the questions people
 * ask most (open/close list) beside the call-back form (InquiryForm) in a
 * photo card.
 *
 * For the visitor who is interested but not ready to register - an easy way
 * to ask before deciding (Shahaf, 19.10.2026, Ein Gedi Hebrew page first).
 * Hebrew-only copy for now.
 */
import { Plus } from "lucide-react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { InquiryForm, type InquiryConfig } from "./InquiryForm";

export interface InquiryQuestion {
  q: string;
  a: string;
}

interface InquirySectionProps {
  inquiry: InquiryConfig;
  questions: InquiryQuestion[];
  photo: string;
  photoAlt: string;
}

const { GOLD, WARM_GRAY, CREAM } = RETREAT_THEME;

export const InquirySection = ({ inquiry, questions, photo, photoAlt }: InquirySectionProps) => {
  return (
    <section className="py-16 md:py-24 px-4" style={{ background: `linear-gradient(180deg, #FFFFFF 0%, ${CREAM} 100%)` }}>
      <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
        <p className="text-sm font-bold" style={{ color: "#A88A45" }}>לפני שנרשמים</p>
        <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-4" style={{ fontFamily: RETREAT_FONTS.serif }}>
          יש לכם שאלות?
        </h2>
        <p className="text-base md:text-lg leading-[1.7]" style={{ color: WARM_GRAY }}>
          ריכזנו כאן את השאלות שאנשים שואלים אותנו הכי הרבה. ואם נשארה לכם שאלה, נשמח לדבר.
        </p>
      </div>
      <div className="max-w-5xl mx-auto grid gap-10 md:gap-14 md:grid-cols-[1.05fr_1fr] items-start">
        {/* Questions */}
        <div>
          <div>
            {questions.map((item, i) => (
              <details key={item.q} open={i === 0} className="group border-b border-[#ECE4D5] py-4">
                <summary className="flex cursor-pointer list-none items-center gap-3.5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  <span
                    className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-sm font-bold"
                    style={{ border: `1.5px solid ${GOLD}`, color: "#A88A45" }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1">{item.q}</span>
                  <Plus className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-45" style={{ color: GOLD }} />
                </summary>
                <p className="mt-2.5 md:mr-11 text-base leading-[1.7]" style={{ color: WARM_GRAY }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Call-back card */}
        <div
          className="md:sticky md:top-24 overflow-hidden rounded-[22px] bg-white"
          style={{ boxShadow: `0 0 0 2px ${GOLD}, 0 24px 60px rgba(60,45,20,.16)` }}
        >
          <div className="relative h-[200px] md:h-[210px]">
            <img src={photo} alt={photoAlt} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: "center 45%" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/55" />
            <span className="absolute bottom-3 right-4 text-[13px] text-white/90">{photoAlt}</span>
          </div>

          <div className="px-5 py-6 md:px-7 md:py-7">
            <InquiryForm
              config={inquiry}
              source="section"
              intro={
                <>
                  <p className="text-sm font-bold" style={{ color: "#A88A45" }}>נשמח לדבר איתכם</p>
                  <h3 className="mt-1 text-2xl md:text-[28px] font-bold" style={{ fontFamily: RETREAT_FONTS.serif }}>
                    רוצים לשמוע עוד?
                  </h3>
                  <p className="mt-1.5 mb-5 text-base leading-relaxed" style={{ color: WARM_GRAY }}>
                    השאירו פרטים ונחזור אליכם לשיחה קצרה ואישית.
                  </p>
                </>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
};
