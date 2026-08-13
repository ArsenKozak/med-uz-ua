import { clinicContact } from "../lib/clinic";
import type { Locale } from "../lib/i18n";

export type LegalDocumentKind = "offer" | "privacy";

export interface LegalSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly items?: readonly string[];
}

export interface LegalDocument {
  readonly title: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly statusTitle: string;
  readonly statusBody: string;
  readonly informationalNotice?: string;
  readonly controllingHref?: "/offer" | "/privacy";
  readonly sections: readonly LegalSection[];
}

export const legalSellerIdentity = {
  legalName: "ФОП Леньо Мирослава Юріївна",
  publicAddress: "м. Ужгород, вул. Юрія Гойди, 10А",
  phoneDisplay: clinicContact.phoneDisplay,
  phoneHref: clinicContact.phoneHref,
} as const;

const ukOffer: LegalDocument = {
  title: "Публічна оферта — European Ophthalmological Clinic",
  description:
    "Проєкт умов продажу товарів онлайн. Документ потребує реквізитів продавця та юридичного погодження до публікації.",
  eyebrow: "Умови дистанційного продажу",
  statusTitle: "Проєкт — не є production-ready офертою",
  statusBody:
    "До набрання документом чинності продавець має підтвердити обов’язкові реєстраційні та платіжні реквізити, офіційний канал претензій, способи оплати й доставки, правила приймання та повернення. Потрібне фінальне погодження українським юристом.",
  sections: [
    {
      title: "1. Продавець і контакти",
      paragraphs: [
        `Відомі та підтверджені для цього проєкту дані продавця: ${legalSellerIdentity.legalName}; адреса обслуговування: ${legalSellerIdentity.publicAddress}; телефон: ${legalSellerIdentity.phoneDisplay}.`,
        "РНОКПП/інший обов’язковий ідентифікатор, реєстраційна та поштова адреси, офіційна електронна пошта, платіжні реквізити й окремий канал претензій ще не надані. До їх підтвердження оформлення та оплата замовлення на сайті недоступні.",
      ],
    },
    {
      title: "2. Предмет договору",
      paragraphs: [
        "Після введення оферти в дію продавець пропонуватиме товари, доступні в каталозі на момент замовлення. Медична консультація та продаж товару є різними правовідносинами; каталог не замінює огляд, діагноз або індивідуальне призначення лікаря.",
      ],
    },
    {
      title: "3. Замовлення й акцепт",
      paragraphs: [
        "Додавання товару до локального кошика не створює договору й не резервує товар. Остаточний порядок оформлення, перевірки наявності, підтвердження продавцем та момент акцепту буде визначено після затвердження бізнес-процесу.",
        "До цього моменту checkout навмисно заблокований, а сайт не приймає оплачені замовлення.",
      ],
    },
    {
      title: "4. Ціни та валюта",
      paragraphs: [
        "Каталог відображає ціни у гривні (UAH). Сервер має повторно визначати актуальну ціну й наявність; дані браузерного кошика не є авторитетними. Умови щодо податків, пакування та вартості доставки потребують підтвердження продавцем.",
      ],
    },
    {
      title: "5. Оплата",
      paragraphs: [
        "Запланований платіжний провайдер — LiqPay, але production-платежі не активовані. Способи оплати, одержувач платежу, момент списання та порядок повернення коштів будуть додані лише після перевірки реквізитів, тестового середовища й серверного обліку замовлень.",
      ],
    },
    {
      title: "6. Доставка, передача ризику та отримання",
      paragraphs: [
        "Запланована інтеграція доставки — Nova Poshta, але її умови, тарифи, строки, географія, порядок зберігання та безоплатний поріг не підтверджені. Ризик випадкової втрати переходить лише у момент, визначений чинним законодавством і погодженими умовами передачі товару; остаточне формулювання потребує юридичного review.",
      ],
    },
    {
      title: "7. Перевірка товару",
      paragraphs: [
        "Покупець має можливість перевірити найменування, кількість, цілісність пакування, комплектність і видимий стан під час отримання в межах правил перевізника. Про пошкодження або невідповідність слід повідомити продавця через підтверджений канал, який ще має бути наданий.",
      ],
    },
    {
      title: "8. Скасування, обмін і повернення",
      paragraphs: [
        "Права споживача визначаються чинним законодавством України, зокрема правилами дистанційних договорів та обміну товару належної якості. Умови й процедура звернення мають бути фіналізовані продавцем і юристом.",
        "Товари належної якості, які відповідно до чинного законодавства належать до категорій, що не підлягають обміну або поверненню, не приймаються до такого обміну або повернення. Конкретне застосування цього правила до контактних лінз і засобів догляду потребує окремого підтвердження продавцем або юристом; постанова КМУ №172 не містить окремого буквального рядка «контактні лінзи».",
        "Це обмеження не скасовує прав споживача щодо товару неналежної якості, дефекту, невідповідності замовленню або недостовірної інформації про товар.",
      ],
    },
    {
      title: "9. Дефектний або невідповідний товар",
      paragraphs: [
        "Звернення щодо дефекту, пошкодження, неправильної комплектації чи іншої невідповідності розглядаються окремо від повернення товару належної якості. Доступні способи захисту визначаються законом і підтвердженими обставинами конкретного випадку; сайт не обмежує такі законні вимоги.",
      ],
    },
    {
      title: "10. Гарантії",
      paragraphs: [
        "Гарантія застосовується лише коли її передбачає закон, виробник або підтверджена інформація конкретного товару. Строки чи додаткові гарантії не припускаються і мають бути вказані в картці або документах товару.",
      ],
    },
    {
      title: "11. Персональні дані та повідомлення",
      paragraphs: [
        "Для запису на консультацію сайт обробляє ім’я та номер телефону. Дані замовлення й доставки можуть оброблятися лише після активації checkout та відповідно до Політики конфіденційності. Сервісні повідомлення стосуватимуться конкретного запиту або замовлення; маркетингові розсилки без окремої правової підстави не заявляються.",
      ],
    },
    {
      title: "12. Претензії, відповідальність і форс-мажор",
      paragraphs: [
        "Офіційний канал і строки розгляду претензій ще потребують підтвердження. Відповідальність сторін визначається законом і не може бути виключена там, де це заборонено. Сторона повідомляє іншу сторону про обставини непереборної сили настільки швидко, наскільки це практично можливо; саме посилання на такі обставини не скасовує вже наявних законних прав.",
      ],
    },
    {
      title: "13. Строк дії та застосовне право",
      paragraphs: [
        "Цей текст є проєктом і не має дати набрання чинності. Після затвердження буде зазначено редакцію та дату дії. До відносин із покупцями застосовується законодавство України, включно із законодавством про захист прав споживачів, електронну комерцію та персональні дані.",
      ],
    },
  ],
};

const ukPrivacy: LegalDocument = {
  title: "Політика конфіденційності — European Ophthalmological Clinic",
  description:
    "Проєкт політики обробки персональних даних для запису, кошика, карт, аналітики та майбутніх commerce-інтеграцій.",
  eyebrow: "Конфіденційність і дані",
  statusTitle: "Проєкт потребує бізнес-рішень і юридичного погодження",
  statusBody:
    "Не визначені остаточні строки зберігання, офіційний privacy-contact і повний перелік production processors. Реалізоване керування аналітичною згодою ще потребує юридичного та account-level review. Документ не заявляє функцій чи угод, яких ще немає.",
  sections: [
    {
      title: "1. Хто відповідає за дані",
      paragraphs: [
        `Передбачуваний володілець даних: ${legalSellerIdentity.legalName}, ${legalSellerIdentity.publicAddress}, телефон ${legalSellerIdentity.phoneDisplay}. Офіційна електронна адреса для privacy-звернень ще не підтверджена.`,
      ],
    },
    {
      title: "2. Які дані обробляються",
      items: [
        "ім’я та телефон, які користувач надсилає у формі запису;",
        "ідентифікатори товарів, кількість і локальний стан кошика;",
        "технічні дані запиту, які обробляє Cloudflare для доставки та захисту сайту;",
        "події взаємодії без імені, телефону, адреси або іншого вільного тексту — лише коли аналітика законно активована;",
        "дані замовлення, платежу й доставки — лише після безпечної активації відповідних функцій.",
      ],
      paragraphs: [],
    },
    {
      title: "3. Мета і правові підстави",
      paragraphs: [
        "Дані використовуються, щоб відповісти на запит про консультацію, підготувати й виконати замовлення після активації commerce, виконати законні обов’язки, забезпечити безпеку та стабільність сайту. Для необов’язкової аналітики або маркетингових тегів потрібна застосовна правова підстава. Сайт запитує окремий дозвіл перед завантаженням Google Tag Manager; юридична достатність формулювання та account-level налаштування ще потребують review.",
      ],
    },
    {
      title: "4. Джерела, одержувачі та обробники",
      paragraphs: [
        "Основне джерело — сам користувач. Cloudflare обслуговує hosting та мережеві запити. Google Fonts і Google Maps можуть отримувати технічні дані під час завантаження відповідного контенту. Google Tag Manager завантажується лише після дозволу користувача, однак GA4/Google Ads теги та їх production-конфігурація потребують окремої перевірки. LiqPay, Nova Poshta та Trustindex/Google Reviews не слід вважати активними production-одержувачами до фактичного запуску відповідних функцій.",
        "Перелік і договори з обробниками, а також production-налаштування мають бути підтверджені до публікації фінальної редакції.",
      ],
    },
    {
      title: "5. Міжнародна передача",
      paragraphs: [
        "Cloudflare і сервіси Google можуть обробляти технічні дані поза Україною. Конкретні країни, механізми передачі та налаштування залежать від production-конфігурації й мають бути перевірені власником до активації необов’язкових інтеграцій.",
      ],
    },
    {
      title: "6. Строки зберігання",
      paragraphs: [
        "Затверджених строків зберігання заявок, замовлень, фінансових документів і технічних журналів не надано. Дані не мають зберігатися довше, ніж це потрібно для відповідної мети та обов’язків за законом; конкретний retention schedule є обов’язковим owner/legal input.",
      ],
    },
    {
      title: "7. Безпека",
      paragraphs: [
        "Код обмежує розмір і формат заявок, не включає контактні дані в аналітичні події та тримає приватні integration keys на серверній стороні. Це не є обіцянкою абсолютної безпеки, конкретного виду шифрування або завершеного incident/deletion workflow.",
      ],
    },
    {
      title: "8. Cookies і локальне сховище",
      paragraphs: [
        "Кошик і вибір щодо аналітики зберігаються у localStorage браузера під окремими технічними ключами; кошик може синхронізуватися між вкладками. До явного дозволу сайт не вставляє скрипт Google Tag Manager. Google Maps, шрифти та майбутні review widgets можуть використовувати власні технології зберігання. Відповідність Google Consent Mode або всім юрисдикціям не заявляється без окремого review.",
      ],
    },
    {
      title: "9. Права людини",
      paragraphs: [
        "У межах законодавства людина може запитати інформацію про обробку, доступ, виправлення, заперечення, обмеження або видалення, відкликати згоду там, де обробка ґрунтується на згоді, та звернутися до компетентного органу або суду. Реалізація права залежить від застосовної підстави й обов’язків зі зберігання.",
      ],
    },
    {
      title: "10. Звернення й оновлення",
      paragraphs: [
        `До підтвердження окремого privacy-contact доступний телефон ${legalSellerIdentity.phoneDisplay}. Не надсилайте медичну інформацію через публічні канали без необхідності. Істотні зміни політики мають публікуватися з датою редакції; поточний проєкт ще не має production effective date.`,
      ],
    },
  ],
};

function informationalDocument(
  locale: Exclude<Locale, "uk">,
  kind: LegalDocumentKind,
): LegalDocument {
  const copy = {
    en: {
      offerTitle: "Public Offer — informational translation",
      privacyTitle: "Privacy Policy — informational translation",
      offerDescription: "Informational summary of the draft Ukrainian online-sales terms.",
      privacyDescription: "Informational summary of the draft Ukrainian privacy policy.",
      eyebrow: "Legal information",
      statusTitle: "Draft — not approved for production",
      statusBody: "The Ukrainian version controls. Mandatory seller details, business rules and Ukrainian counsel review are still outstanding.",
      notice: "This is an informational translation. If wording differs, consult the controlling Ukrainian draft.",
      offerSections: [
        ["1. Seller", `Known details: ${legalSellerIdentity.legalName}, ${legalSellerIdentity.publicAddress}, phone ${legalSellerIdentity.phoneDisplay}. Registration identifier, official email, payment details and complaints channel are pending.`],
        ["2. Scope and order formation", "The future terms cover goods shown as available. A local cart does not reserve goods or form a contract. Checkout remains disabled until availability, acceptance and fulfilment rules are approved."],
        ["3. Prices and payment", "Prices are displayed in UAH and must be rebuilt from the server catalogue. LiqPay production payment is not active; payment recipient, refund and charging rules are pending."],
        ["4. Delivery, risk and inspection", "Nova Poshta delivery is planned but rates, timing, geography, storage and any threshold are unconfirmed. Risk transfer and inspection rules require final business and legal approval."],
        ["5. Cancellation, returns and defects", "Applicable Ukrainian consumer law governs. Goods of proper quality that legally fall within non-returnable categories may not be exchanged or returned, but application to contact lenses and care products requires seller/counsel confirmation; Resolution No. 172 does not literally list ‘contact lenses’. This never removes remedies for defective, non-conforming or misdescribed goods."],
        ["6. Warranty, data and communications", "A warranty applies only where law, manufacturer documents or verified product information provides it. Appointment and future order data are handled under the privacy policy; no unsolicited marketing promise is made."],
        ["7. Complaints, liability and force majeure", "The official complaint channel and handling periods are pending. Liability follows applicable law and cannot be excluded where prohibited. Force majeure does not automatically remove accrued statutory rights."],
        ["8. Term and law", "This draft has no effective date. After approval it will identify its revision and effective date. Ukrainian law governs, including consumer, e-commerce and data-protection rules."],
      ],
      privacySections: [
        ["1. Controller", `Intended controller: ${legalSellerIdentity.legalName}, ${legalSellerIdentity.publicAddress}, phone ${legalSellerIdentity.phoneDisplay}. A dedicated privacy email is pending.`],
        ["2. Data and purposes", "The appointment form processes name and phone. The browser stores cart product IDs and quantities. Cloudflare processes technical requests. Order, payment and delivery data will be processed only after those functions are safely activated."],
        ["3. Legal bases", "Data is used to answer requests, take pre-contract steps, perform approved orders, meet legal duties and protect the service. Optional analytics or marketing tags require an applicable legal basis. The site asks for permission before loading Google Tag Manager; wording and account configuration still require legal review."],
        ["4. Recipients and transfers", "Cloudflare hosts the site; Google Fonts and Maps may receive technical data. Google Tag Manager loads only after permission, while GA4/Ads configuration still requires account review. LiqPay, Nova Poshta and Trustindex are not represented as live production recipients until activated. Some providers may process data outside Ukraine; exact safeguards require configuration review."],
        ["5. Retention and security", "No approved retention schedule has been supplied. Data should be kept only as needed for its purpose and legal duties. Current code limits requests and avoids analytics PII, but does not promise absolute security, a particular encryption regime or a completed deletion workflow."],
        ["6. Storage and rights", "The cart and analytics choice use separate localStorage keys; GTM is not inserted before permission. Third-party content may use its own storage, and Consent Mode compliance is not claimed. Subject to law, people may request access, correction, objection, restriction or deletion, withdraw consent where relevant, and complain to a competent authority or court."],
        ["7. Contact and updates", `Until a dedicated privacy contact is confirmed, use ${legalSellerIdentity.phoneDisplay}. The final policy must carry a revision/effective date after owner and legal approval.`],
      ],
    },
    sk: {
      offerTitle: "Verejná ponuka — informačný preklad",
      privacyTitle: "Zásady ochrany súkromia — informačný preklad",
      offerDescription: "Informačné zhrnutie návrhu ukrajinských podmienok online predaja.",
      privacyDescription: "Informačné zhrnutie návrhu ukrajinských zásad ochrany súkromia.",
      eyebrow: "Právne informácie",
      statusTitle: "Návrh — neschválený pre produkciu",
      statusBody: "Rozhodujúca je ukrajinská verzia. Povinné údaje predávajúceho, obchodné pravidlá a kontrola ukrajinským právnikom ešte chýbajú.",
      notice: "Toto je informačný preklad. Pri rozdiele znenia použite rozhodujúci ukrajinský návrh.",
      offerSections: [
        ["1. Predávajúci", `Známe údaje: ${legalSellerIdentity.legalName}, ${legalSellerIdentity.publicAddress}, telefón ${legalSellerIdentity.phoneDisplay}. Registračný identifikátor, oficiálny e-mail, platobné údaje a kanál reklamácií čakajú na potvrdenie.`],
        ["2. Predmet a objednávka", "Budúce podmienky sa týkajú dostupného tovaru. Lokálny košík tovar nerezervuje ani nevytvára zmluvu. Checkout zostáva vypnutý do schválenia dostupnosti, akceptácie a plnenia."],
        ["3. Ceny a platba", "Ceny sú v UAH a server ich musí znovu overiť v katalógu. Produkčná platba LiqPay nie je aktívna; príjemca, refundácia a pravidlá účtovania čakajú na potvrdenie."],
        ["4. Doručenie a kontrola", "Doručenie Nova Poshta je plánované, ale sadzby, termíny, územie, skladovanie ani bezplatný limit nie sú potvrdené. Prechod rizika a kontrola tovaru vyžadujú konečné obchodné a právne schválenie."],
        ["5. Zrušenie, vrátenie a vady", "Platí ukrajinské spotrebiteľské právo. Tovar riadnej kvality v zákonom nevymeniteľných kategóriách sa nemusí vymieňať ani vracať; použitie na kontaktné šošovky a starostlivosť musí potvrdiť predávajúci/právnik a uznesenie č. 172 doslova neuvádza ‘kontaktné šošovky’. Práva pri vadnom, nezhodnom alebo nesprávne opísanom tovare zostávajú zachované."],
        ["6. Záruka, údaje a komunikácia", "Záruka platí len podľa zákona, dokumentov výrobcu alebo overených informácií. Údaje o termíne a budúcej objednávke upravujú zásady ochrany súkromia; nevyžiadaný marketing sa nesľubuje."],
        ["7. Reklamácie a zodpovednosť", "Oficiálny kanál a lehoty reklamácií chýbajú. Zodpovednosť sa riadi právom a nemožno ju vylúčiť, ak to zákon zakazuje. Vyššia moc automaticky neruší vzniknuté zákonné práva."],
        ["8. Účinnosť a právo", "Návrh nemá dátum účinnosti. Po schválení uvedie verziu a dátum. Uplatňuje sa ukrajinské právo vrátane ochrany spotrebiteľa, e-commerce a údajov."],
      ],
      privacySections: [
        ["1. Prevádzkovateľ", `Zamýšľaný prevádzkovateľ: ${legalSellerIdentity.legalName}, ${legalSellerIdentity.publicAddress}, telefón ${legalSellerIdentity.phoneDisplay}. Samostatný privacy e-mail chýba.`],
        ["2. Údaje a účely", "Formulár spracúva meno a telefón. Prehliadač ukladá ID a množstvá košíka. Cloudflare spracúva technické požiadavky. Objednávkové, platobné a doručovacie údaje až po bezpečnej aktivácii."],
        ["3. Právne základy", "Údaje slúžia na odpoveď, predzmluvné kroky, schválené objednávky, právne povinnosti a bezpečnosť. Voliteľná analytika/marketing vyžadujú právny základ. Web žiada povolenie pred načítaním Google Tag Managera; text a konfigurácia účtu ešte vyžadujú právnu kontrolu."],
        ["4. Príjemcovia a prenos", "Cloudflare hostuje web; Google Fonts a Maps môžu dostať technické údaje. GTM/Google vyžadujú kontrolu súhlasu a účtu. LiqPay, Nova Poshta a Trustindex nie sú označené za live príjemcov pred aktiváciou. Prenos mimo Ukrajiny vyžaduje kontrolu safeguards."],
        ["5. Uchovávanie a bezpečnosť", "Schválený retention harmonogram chýba. Údaje sa majú držať len podľa účelu a zákona. Kód obmedzuje požiadavky a neposiela PII do analytiky, no nesľubuje absolútnu bezpečnosť, konkrétne šifrovanie ani hotový deletion workflow."],
        ["6. Úložisko a práva", "Košík a voľba analytiky používajú oddelené kľúče localStorage; GTM sa pred povolením nevloží. Tretie strany môžu použiť vlastné úložisko a zhoda s Consent Mode sa netvrdí. Podľa práva možno žiadať prístup, opravu, námietku, obmedzenie alebo vymazanie, odvolať súhlas a podať sťažnosť."],
        ["7. Kontakt a zmeny", `Do potvrdenia privacy kontaktu použite ${legalSellerIdentity.phoneDisplay}. Finálna politika musí po schválení uviesť verziu a účinnosť.`],
      ],
    },
    hu: {
      offerTitle: "Nyilvános ajánlat — tájékoztató fordítás",
      privacyTitle: "Adatvédelmi szabályzat — tájékoztató fordítás",
      offerDescription: "Az ukrán online értékesítési feltételek tervezetének tájékoztató összefoglalója.",
      privacyDescription: "Az ukrán adatvédelmi tervezet tájékoztató összefoglalója.",
      eyebrow: "Jogi tájékoztatás",
      statusTitle: "Tervezet — éles használatra nincs jóváhagyva",
      statusBody: "Az ukrán változat az irányadó. A kötelező eladói adatok, üzleti szabályok és ukrán jogi felülvizsgálat még hiányoznak.",
      notice: "Ez tájékoztató fordítás. Eltérés esetén az irányadó ukrán tervezetet kell követni.",
      offerSections: [
        ["1. Eladó", `Ismert adatok: ${legalSellerIdentity.legalName}, ${legalSellerIdentity.publicAddress}, telefon ${legalSellerIdentity.phoneDisplay}. A nyilvántartási azonosító, hivatalos e-mail, fizetési adatok és panaszcsatorna megerősítésre vár.`],
        ["2. Tárgy és megrendelés", "A jövőbeli feltételek az elérhető termékekre vonatkoznak. A helyi kosár nem foglal terméket és nem hoz létre szerződést. A checkout az elfogadási és teljesítési szabályok jóváhagyásáig letiltva marad."],
        ["3. Árak és fizetés", "Az árak UAH-ban szerepelnek, és a szerver a katalógusból újra ellenőrzi őket. Az éles LiqPay nem aktív; a kedvezményezett, visszatérítés és terhelés szabályai még hiányoznak."],
        ["4. Szállítás és átvétel", "A Nova Poshta integráció tervezett, de a díjak, idők, terület, tárolás és ingyenes küszöb nincs megerősítve. A kárveszély és ellenőrzés végleges üzleti és jogi jóváhagyást igényel."],
        ["5. Elállás, visszaküldés és hibák", "Az ukrán fogyasztóvédelmi jog alkalmazandó. A jog szerint nem visszaváltható kategóriába tartozó megfelelő minőségű termék nem feltétlenül cserélhető/visszaküldhető; a kontaktlencsékre és ápolószerekre való alkalmazást az eladónak/jogásznak kell igazolnia, és a 172. határozat szó szerint nem sorolja fel a ‘kontaktlencséket’. A hibás, nem megfelelő vagy félreírt termékkel kapcsolatos jogok megmaradnak."],
        ["6. Jótállás, adatok és üzenetek", "Jótállás csak jogszabály, gyártói dokumentum vagy ellenőrzött termékinformáció alapján van. Az időpont- és későbbi rendelési adatokat az adatvédelmi szabályzat rendezi; kéretlen marketinget nem ígérünk."],
        ["7. Panasz és felelősség", "A hivatalos panaszcsatorna és határidők hiányoznak. A felelősséget a jog rendezi, és ahol tilos, nem zárható ki. A vis maior nem törli automatikusan a már fennálló jogokat."],
        ["8. Hatály és jog", "A tervezetnek nincs hatálybalépési dátuma. Jóváhagyás után verziót és dátumot kap. Az ukrán fogyasztóvédelmi, e-kereskedelmi és adatvédelmi jog alkalmazandó."],
      ],
      privacySections: [
        ["1. Adatkezelő", `Tervezett adatkezelő: ${legalSellerIdentity.legalName}, ${legalSellerIdentity.publicAddress}, telefon ${legalSellerIdentity.phoneDisplay}. Külön adatvédelmi e-mail még nincs.`],
        ["2. Adatok és célok", "Az időpontűrlap nevet és telefonszámot kezel. A böngésző termékazonosítókat és mennyiséget tárol. A Cloudflare technikai kéréseket kezel. Rendelési, fizetési és szállítási adatok csak biztonságos aktiválás után."],
        ["3. Jogalapok", "Az adatok megkeresésre válaszhoz, szerződés előtti lépésekhez, jóváhagyott rendelésekhez, jogi kötelezettséghez és biztonsághoz kellenek. Az opcionális analitika/marketing jogalapot igényel. A webhely engedélyt kér a Google Tag Manager betöltése előtt; a szöveg és a fiókbeállítás még jogi ellenőrzést igényel."],
        ["4. Címzettek és adattovábbítás", "A Cloudflare hostol; a Google Fonts és Maps technikai adatokat kaphat. A GTM/Google hozzájárulási és fiókellenőrzést igényel. A LiqPay, Nova Poshta és Trustindex az aktiválás előtt nem live címzett. Az Ukrajnán kívüli továbbítás garanciáit konfiguráció alapján kell ellenőrizni."],
        ["5. Megőrzés és biztonság", "Nincs jóváhagyott megőrzési ütemterv. Az adatokat csak a célhoz és jogi kötelezettséghez szükséges ideig szabad tartani. A kód korlátozza a kéréseket és nem küld PII-t analitikába, de nem ígér abszolút biztonságot, meghatározott titkosítást vagy kész törlési folyamatot."],
        ["6. Tárolás és jogok", "A kosár és az analitikai választás külön localStorage-kulcsot használ; a GTM engedély előtt nem kerül beillesztésre. Harmadik felek saját tárolást használhatnak, Consent Mode megfelelést nem állítunk. Jog szerint hozzáférés, helyesbítés, tiltakozás, korlátozás vagy törlés kérhető, a hozzájárulás visszavonható és panasz tehető."],
        ["7. Kapcsolat és frissítés", `Külön adatvédelmi kapcsolat megerősítéséig a ${legalSellerIdentity.phoneDisplay} szám használható. A végleges szabályzatnak jóváhagyott verziót és hatálybalépési dátumot kell kapnia.`],
      ],
    },
  } as const;

  const localized = copy[locale];
  const isOffer = kind === "offer";
  const tuples = isOffer
    ? localized.offerSections
    : localized.privacySections;

  return {
    title: isOffer ? localized.offerTitle : localized.privacyTitle,
    description: isOffer
      ? localized.offerDescription
      : localized.privacyDescription,
    eyebrow: localized.eyebrow,
    statusTitle: localized.statusTitle,
    statusBody: localized.statusBody,
    informationalNotice: localized.notice,
    controllingHref: isOffer ? "/offer" : "/privacy",
    sections: tuples.map(([title, paragraph]) => ({
      title,
      paragraphs: [paragraph],
    })),
  };
}

export function getLegalDocument(
  locale: Locale,
  kind: LegalDocumentKind,
): LegalDocument {
  if (locale === "uk") {
    return kind === "offer" ? ukOffer : ukPrivacy;
  }

  return informationalDocument(locale, kind);
}
