import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, ChevronRight, ChevronLeft } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import maitreyaLogo from "@/assets/maitreya-logo.png";
import heroImage from "@/assets/retreat/hero-dead-sea-gen.jpeg";
import threeDeities from "@/assets/retreat/three-deities.jpg";
import lamaGlennPhoto from "@/assets/retreat/lama-glenn-big.jpg";
import druponPhoto from "@/assets/retreat/drupon-chongwol.png";
import venuePhoto1 from "@/assets/retreat/venue-eingedi-1.jpg";
import venuePhoto2 from "@/assets/retreat/venue-eingedi-2.jpg";
import gallery1 from "@/assets/retreat/gallery-1.jpg";
import gallery2 from "@/assets/retreat/gallery-2.jpg";
import gallery3 from "@/assets/retreat/gallery-3.jpg";
import gallery4 from "@/assets/retreat/gallery-4.jpg";
import gallery5 from "@/assets/retreat/gallery-5.jpg";
import gallery6 from "@/assets/retreat/gallery-6.jpg";
import gallery7 from "@/assets/retreat/gallery-7.jpg";
import gallery8 from "@/assets/retreat/gallery-8.jpg";
import gallery9 from "@/assets/retreat/gallery-9.jpg";
import gallery10 from "@/assets/retreat/gallery-10.jpg";
import gallery11 from "@/assets/retreat/gallery-11.jpg";
import gallery12 from "@/assets/retreat/gallery-12.jpg";
import gallery13 from "@/assets/retreat/gallery-13.jpg";
import gallery14 from "@/assets/retreat/gallery-14.jpg";
import gallery15 from "@/assets/retreat/gallery-15.jpg";
import venuePhoto3 from "@/assets/retreat/venue-eingedi-3.jpg";
import venuePhoto4 from "@/assets/retreat/venue-eingedi.jpg";

const REGISTRATION_URL = "#"; // TODO: replace with actual registration link

const galleryImages = [gallery4, gallery1, gallery3, gallery8, gallery2, gallery9, gallery10, gallery7, gallery5, gallery6, gallery11, gallery12, gallery13, gallery14, gallery15];

const EinGediRetreat = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const visibleCount = 3;
  const maxIndex = galleryImages.length - visibleCount;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCarouselIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused || lightboxIndex !== null) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, lightboxIndex, nextSlide]);
  useDocumentTitle("ריטריט הילינג בעין גדי | מאיטרייה סנגהה ישראל");

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="py-2 px-6 flex items-center justify-center border-b border-border bg-card">
        <a href="https://maitreya.org.il/">
          <img
            src={maitreyaLogo}
            alt="מאיטרייה סנגהה ישראל"
            className="h-8 md:h-10 object-contain"
          />
        </a>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-[hsl(220,50%,15%)]/60" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-md">
            דרך הריפוי וההילינג הבודהיסטי
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-heading mb-4 drop-shadow-sm">
            שישה ימי עומק של תרגולי ריפוי והארכת חיים ממסורת הבודהיזם הטנטרי הטיבטי
          </p>
          <p className="text-lg md:text-xl text-white/80 mb-8 drop-shadow-sm">
            1-6 ביוני 2026 | בית ספר שדה עין גדי
          </p>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-8">
            מהו ריפוי בודהיסטי?
          </h2>
          <div className="space-y-6 text-lg text-foreground/80 leading-relaxed">
            <p>
              המסורת הבודהיסטית עתיקת היומין מביאה אמצעים רבי עוצמה לריפוי
              והארה. בריטריט מיוחד זה נלמד מהו ריפוי לפי הבודהיזם הטנטרי
              ונתרגל שלושה מתרגולי הליבה של הריפוי הטנטרי - תרגולים עתיקים
              ורבי עוצמה לריפוי, לאיזון, להארכת חיים ולהעמקה בדרך הרוחנית.
            </p>
            <p>
              במהלך שישה ימים נקבל חניכות ונתרגל לעומק עם לאמה גלן מולין
              ודרופון צ׳ונגוואל-לה, באווירה רגועה ומרפאה של מדבר יהודה וים
              המלח.
            </p>
          </div>
        </div>
      </section>

      {/* Three Practices */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-4">
            שלושת התרגולים
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            שלושה תרגולי ליבה ממסורת הבודהיזם הטנטרי הטיבטי, כולל חניכות
          </p>
          <div className="max-w-3xl mx-auto mb-12">
            <img
              src={threeDeities}
              alt="שלושת אלוהויות הריפוי: צ׳אקרסמוורה הלבן, מדיסין בודהא וטארה הלבנה"
              className="w-full rounded-lg shadow-md"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "טארה הלבנה",
                subtitle: "הגלגל מגשים המשאלות",
                description:
                  "תרגול להארכת חיים, בריאות והגנה. טארה הלבנה היא מגלמת החמלה הנשית, ותרגולה מביא אריכות ימים, חיוניות ושלום פנימי.",
              },
              {
                title: "מדיסין בודהא",
                subtitle: "הבודהא של הרפואה",
                description:
                  "תרגול מרכזי לריפוי גוף ונפש. מדיסין בודהא הוא ארכיטיפ הריפוי בבודהיזם הטנטרי, ותרגולו מפעיל את כוחות הריפוי הטבעיים שבתוכנו.",
              },
              {
                title: "צ׳אקרסמוורה הלבן",
                subtitle: "אנרגיית החיים הארוכים",
                description:
                  "תרגול עוצמתי לריפוי עמוק ושחרור מכשולים. צ׳אקרסמוורה הלבן הוא מהתרגולים החזקים ביותר במסורת הטנטרית לטיהור והתחדשות.",
              },
            ].map((practice) => (
              <div
                key={practice.title}
                className="bg-card rounded-lg border border-border p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-heading text-xl font-bold text-primary mb-1">
                  {practice.title}
                </h3>
                <p className="text-sm text-accent font-medium mb-4">
                  {practice.subtitle}
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  {practice.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-4">
            בית ספר שדה עין גדי
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full mb-8" />
          <div className="space-y-6 text-lg text-foreground/80 leading-relaxed mb-8">
            <p>
              הריטריט יתקיים בבית ספר שדה עין גדי, מתחם שקט ויפה הפונה לים
              המלח עם נוף ישיר לים ולהרי מואב. חמש דקות נסיעה מקיבוץ עין גדי,
              קרוב לשמורת הטבע ולמצוקי דרגות.
            </p>
            <p>
              החדרים שופצו בשנים האחרונות - פשוטים, יפים ונוחים. כל חדר כולל
              שירותים ומקלחת, מזגן ופינת קפה. המתחם כולל אולמות ממוזגים, חדר
              אוכל עם ארוחות מלאות, ושטחי חוץ ירוקים ונעימים.
            </p>
            <p>
              מדבר יהודה, האוויר היבש, השקט העמוק והנוף המרהיב - כל אלו הופכים
              לחלק בלתי נפרד מחוויית הריטריט והריפוי.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden shadow-md">
            <img
              src={venuePhoto1}
              alt="נוף עין גדי - מבט על הנווה המדברי וים המלח"
              className="col-span-2 w-full h-48 md:h-64 object-cover"
            />
            <img
              src={venuePhoto2}
              alt="מתחם בית ספר שדה עין גדי - מבנים ושבילים"
              className="w-full h-36 md:h-48 object-cover"
            />
            <img
              src={venuePhoto4}
              alt="דקלים, מדשאות ויעלים על רקע מצוקי המדבר"
              className="w-full h-36 md:h-48 object-cover"
            />
            <img
              src={venuePhoto3}
              alt="שטחי החוץ הירוקים של בית ספר שדה עין גדי"
              className="col-span-2 w-full h-48 md:h-64 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-4">
            מבנה הריטריט
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full mb-8" />
          <p className="text-center text-muted-foreground mb-10">
            שישה ימים, שלושה תרגולים - יומיים לכל תרגול
          </p>
          <div className="space-y-4 max-w-lg mx-auto">
            {[
              { days: "ימים 1-2 (יום שני-שלישי)", practice: "טארה הלבנה" },
              { days: "ימים 3-4 (יום רביעי-חמישי)", practice: "מדיסין בודהא" },
              {
                days: "ימים 5-6 (יום שישי-שבת)",
                practice: "צ׳אקרסמוורה הלבן",
              },
            ].map((block) => (
              <div
                key={block.days}
                className="flex items-center gap-4 bg-card rounded-lg border border-border p-5"
              >
                <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{block.days}</p>
                  <p className="text-accent font-heading text-lg">
                    {block.practice}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-8 text-sm">
            כל יום יכלול הוראה, חניכה, תרגול מודרך ומדיטציה.
            <br />
            הריטריט מתאים למתרגלים מתחילים ומתקדמים וילווה בתרגום לעברית.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-4">
            מחירון
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full mb-4" />
          <p className="text-center text-muted-foreground mb-10">
            6 ימים, 5 לילות | כולל לינה, ארוחות מלאות והשתתפות בכל
            השיעורים והתרגולים
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                type: "חדר ליחיד",
                price: "4,500",
                note: "חדר פרטי",
              },
              {
                type: "2 בחדר",
                price: "3,850",
                note: "חדר משותף לשניים",
                featured: true,
              },
              {
                type: "3 בחדר",
                price: "3,350",
                note: "חדר משותף לשלושה",
              },
            ].map((option) => (
              <div
                key={option.type}
                className={`rounded-lg border p-8 text-center transition-shadow ${
                  option.featured
                    ? "border-accent bg-accent/5 shadow-md"
                    : "border-border bg-card shadow-sm hover:shadow-md"
                }`}
              >
                <h3 className="font-heading text-xl font-bold text-primary mb-2">
                  {option.type}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {option.note}
                </p>
                <p className="text-3xl font-bold text-primary mb-1">
                  {option.price}
                  <span className="text-lg font-normal mr-1">₪</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-12">
            המורים
          </h2>
          <div className="space-y-14 max-w-2xl mx-auto">
            {/* Lama Glenn */}
            <div className="text-center">
              <img
                src={lamaGlennPhoto}
                alt="לאמה גלן מולין"
                className="w-full max-w-xl mx-auto mb-6 rounded-lg object-cover shadow-md"
              />
              <h3 className="font-heading text-2xl font-bold text-primary mb-4">
                לאמה גלן מולין
              </h3>
              <p className="text-foreground/80 leading-relaxed text-lg max-w-lg mx-auto">
                לאמה גלן מולין הינו מורה וותיק ואהוב של טנטרה בודהיסטית וטומו.
                הוא תלמידם הישיר של הוד קדושתו הדלאי לאמה ה-14, ומורי השורש שלו
                הם לינג רינפוצ׳ה השישי וטריג׳נג רינפוצ׳ה - מורי השורש האישיים של
                הדלאי לאמה ה-14. לאמה גלן מלמד בודהיזם טיבטי מעל שלושים שנה
                לאלפי תלמידים בכל רחבי העולם.
              </p>
            </div>
            {/* Drupon Chongwol-la */}
            <div className="text-center max-w-lg mx-auto">
              <img
                src={druponPhoto}
                alt="דרופון צ׳ונגוואל-לה"
                className="w-52 mx-auto mb-5 rounded-lg object-cover shadow-md"
              />
              <h3 className="font-heading text-xl font-bold text-primary mb-4">
                דרופון צ׳ונגוואל-לה
              </h3>
              <p className="text-foreground/80 leading-relaxed max-w-md mx-auto">
                דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן
                לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש
                כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה
                בהדרכת מורה השורש שלו, לאמה גלן. דרופון צ׳ונגוואל-לה מלמד
                תלמידים ברחבי העולם - בקוריאה, ארה״ב, רוסיה, ישראל, דרום אמריקה
                ועוד.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Carousel */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-4">
            מהריטריטים שלנו
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full mb-10" />
          <div
            className="relative max-w-4xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Carousel viewport - shows 3 at a time */}
            <div className="overflow-hidden rounded-lg" style={{ margin: "0 -10px" }} dir="ltr">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(${carouselIndex * (-100 / 3)}%)`,
                }}
              >
                {galleryImages.map((src, i) => (
                  <div
                    key={i}
                    className="shrink-0 px-[10px]"
                    style={{ width: `${100 / 3}%` }}
                  >
                    <div
                      onClick={() => setLightboxIndex(i)}
                      className="cursor-pointer rounded-md overflow-hidden"
                      role="button"
                      tabIndex={0}
                    >
                      <img
                        src={src}
                        alt="מריטריטים קודמים של מאיטרייה סנגהה"
                        className="w-full aspect-square object-cover transition-opacity hover:opacity-90"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrows */}
            <button
              onClick={prevSlide}
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-gray-50 text-primary rounded-full p-1.5 transition-colors border border-border"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-gray-50 text-primary rounded-full p-1.5 transition-colors border border-border"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-6">
              {galleryImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === carouselIndex ? "bg-primary" : "bg-primary/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 left-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length);
            }}
          >
            <ChevronRight className="h-10 w-10" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
            }}
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <img
            src={galleryImages[lightboxIndex]}
            alt="מריטריטים קודמים של מאיטרייה סנגהה"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* CTA */}
      <section
        className="py-16 md:py-24"
        style={{ background: "var(--spiritual-gradient)" }}
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            הצטרפו לריטריט
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
            שישה ימים של חניכות ותרגולי ריפוי עומק, על שפת ים המלח, עם לאמה גלן
            ודרופון צ׳ונגוואל-לה
          </p>
          <a href={REGISTRATION_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-12 py-4 text-lg rounded-full shadow-lg transition-transform hover:scale-105">
              להרשמה
              <ExternalLink className="h-5 w-5 mr-2 -scale-x-100" />
            </Button>
          </a>
          <p className="text-sm text-primary-foreground/60 mt-6">
            מספר המקומות מוגבל
          </p>
        </div>
      </section>

      {/* Cancellation + Scholarships + Contact */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-3xl space-y-12">
          {/* Cancellation */}
          <div>
            <h3 className="font-heading text-xl font-bold text-primary mb-3">
              מדיניות ביטול
            </h3>
            <ul className="space-y-2 text-foreground/70 leading-relaxed">
              <li>ביטול עד 30 יום לפני הריטריט - החזר מלא</li>
              <li>ביטול 14-30 יום לפני - החזר של 50%</li>
              <li>ביטול פחות מ-14 יום לפני - ללא החזר</li>
            </ul>
          </div>

          {/* Scholarships */}
          <div>
            <h3 className="font-heading text-xl font-bold text-primary mb-3">
              מלגות
            </h3>
            <p className="text-foreground/70 leading-relaxed">
              מאיטרייה סנגהה ישראל מעניקה מספר מלגות חלקיות למשתתפים שזקוקים
              לסיוע כלכלי. לפרטים ולהגשת בקשה, צרו קשר בדוא״ל.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-xl font-bold text-primary mb-3">
              צרו קשר
            </h3>
            <p className="text-foreground/70 leading-relaxed">
              לשאלות, בירורים והרשמה:{" "}
              <a
                href="mailto:info@maitreya.org.il"
                className="text-accent hover:underline"
              >
                info@maitreya.org.il
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>
          © {new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.
        </p>
      </footer>
    </div>
  );
};

export default EinGediRetreat;
