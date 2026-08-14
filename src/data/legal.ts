import { legalConfig } from "../config/legal";
import type { Locale } from "../lib/i18n";

export type LegalDocumentKind = "offer" | "privacy";

export interface LegalSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly items?: readonly string[];
}

export interface LegalSource {
  readonly label: string;
  readonly href: `https://${string}`;
}

export interface LegalDocument {
  readonly title: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly statusTitle: string;
  readonly statusBody: string;
  readonly lastUpdatedLabel: string;
  readonly lastUpdated: "2026-08-14";
  readonly informationalNotice?: string;
  readonly controllingHref?: "/offer" | "/privacy";
  readonly sections: readonly LegalSection[];
  readonly sources: readonly LegalSource[];
}

const offerSources: readonly LegalSource[] = [
  {
    label: "Закон України «Про захист прав споживачів»",
    href: "https://zakon.rada.gov.ua/laws/show/1023-12",
  },
  {
    label: "Закон України «Про електронну комерцію»",
    href: "https://zakon.rada.gov.ua/laws/show/675-19",
  },
  {
    label: "Постанова Кабінету Міністрів України № 172",
    href: "https://zakon.rada.gov.ua/laws/show/172-94-%D0%BF",
  },
] as const;

const privacySources: readonly LegalSource[] = [
  {
    label: "Закон України «Про захист персональних даних»",
    href: "https://zakon.rada.gov.ua/laws/show/2297-17",
  },
  {
    label: "Закон України «Про електронну комерцію»",
    href: "https://zakon.rada.gov.ua/laws/show/675-19",
  },
] as const;

const ukOffer: LegalDocument = {
  title: "Публічна оферта — European Ophthalmological Clinic",
  description:
    "Умови дистанційного продажу товарів ФОП Леньо Мирославою Юріївною через Med.uz.ua.",
  eyebrow: "Умови дистанційного продажу",
  statusTitle: "Редакція для юридичної перевірки перед публікацією",
  statusBody:
    "Реквізити в цій редакції надані власником. Перед production-публікацією рекомендована перевірка українським юристом, зокрема правил акцепту, оплати, доставки й повернення. Поки checkout на сайті технічно недоступний, сайт не приймає онлайн-замовлення або оплату.",
  lastUpdatedLabel: "Останнє оновлення",
  lastUpdated: "2026-08-14",
  sections: [
    {
      title: "1. Продавець і контакти",
      paragraphs: [
        `Продавець: ${legalConfig.legalName}. ${legalConfig.taxIdLabel}: ${legalConfig.taxId}. Юридична та фактична адреса: ${legalConfig.legalAddress}. Телефон: ${legalConfig.phoneDisplay}. Електронна пошта: ${legalConfig.email}.`,
        "Ця оферта регулює лише дистанційний продаж товарів через Med.uz.ua. Медична консультація, діагностика та лікування є окремими правовідносинами. Інформація каталогу не замінює огляд лікаря або індивідуальне медичне призначення.",
      ],
    },
    {
      title: "2. Предмет договору",
      paragraphs: [
        "Продавець пропонує покупцеві придбати товар із каталогу за назвою, характеристиками, ціною та статусом наявності, показаними перед оформленням. Склад конкретного замовлення визначається підтвердженими позиціями та кількістю.",
        "Фотографії та описи допомагають ідентифікувати товар, але колір може відрізнятися через налаштування екрана. Суттєві характеристики, модель і комплектацію слід перевірити в картці товару та під час отримання.",
      ],
    },
    {
      title: "3. Замовлення, виправлення даних і акцепт",
      paragraphs: [
        "Додавання товару до локального кошика не резервує товар і не укладає договір. До остаточної дії покупець може змінити склад кошика та надані дані.",
        "Після активації checkout остаточна кнопка оформлення має бути однозначно позначена як дія, що створює обов’язок оплатити замовлення. Акцептом є належно виконана така дія після ознайомлення з офертою, ціною, доставкою та способом оплати. Електронний договір вважається укладеним у момент отримання інформаційною системою продавця акцепту; продавець оперативно надсилає підтвердження отримання замовлення на вказаний канал.",
        "Якщо товар недоступний або замовлення не може бути прийняте, система не повинна створювати стан успішної оплати. Продавець повідомляє покупця та, якщо кошти вже були списані, організовує їх повернення відповідно до закону й правил платіжного провайдера.",
      ],
    },
    {
      title: "4. Ціни й валюта",
      paragraphs: [
        "Ціни на сайті зазначаються у гривні (UAH). Перед акцептом покупець бачить ціну товарів, доступну вартість доставки та загальну суму. Сервер повторно визначає актуальні товари й ціни; дані локального кошика не є авторитетними.",
        "Якщо в ціні або описі сталася очевидна технічна помилка, продавець повідомляє про неї до відправлення та пропонує підтвердити виправлені умови або скасувати замовлення без штрафу.",
      ],
    },
    {
      title: "5. Оплата",
      paragraphs: [
        "Доступні способи оплати показуються до акцепту. Якщо інтерфейс пропонує LiqPay, платіж обробляється LiqPay на захищеній стороні провайдера, а сайт продавця не повинен отримувати повні реквізити платіжної картки.",
        "Платіж вважається виконаним після підтвердження платіжним провайдером і серверної перевірки статусу замовлення. Сам перехід на платіжну сторінку або натискання кнопки не підтверджує успішну оплату. Повернення коштів здійснюється у спосіб і строки, передбачені законом та застосовними правилами провайдера, після підтвердження підстави й суми.",
      ],
    },
    {
      title: "6. Доставка, передання товару та ризик",
      paragraphs: [
        "Якщо під час checkout доступна Nova Poshta, покупець обирає підтримуваний населений пункт і відділення або поштомат. Орієнтовний строк, вартість, географія та інші доступні умови показуються або підтверджуються до акцепту. Тарифи та правила перевізника застосовуються в частині, що не обмежує обов’язкові права споживача.",
        "Обов’язок передати товар виконується та ризик випадкової втрати переходить у момент фактичного вручення товару покупцеві або визначеному ним одержувачу, якщо інше прямо не встановлено законом для конкретної ситуації. Право власності переходить разом із переданням товару після виконання погоджених умов оплати.",
      ],
    },
    {
      title: "7. Перевірка комплектності та стану",
      paragraphs: [
        "Під час отримання покупцеві слід перевірити назву, модель, кількість, комплектність, цілісність пакування та видимий стан товару в межах правил перевізника. Пошкодження пакування або невідповідність бажано зафіксувати разом із представником перевізника та негайно повідомити продавця.",
        "Непроведення огляду не позбавляє покупця прав, які не можуть бути обмежені законом, зокрема щодо прихованих недоліків.",
      ],
    },
    {
      title: "8. Скасування замовлення",
      paragraphs: [
        `До передання товару перевізнику покупець може звернутися за телефоном ${legalConfig.phoneDisplay} або на ${legalConfig.email}, зазначивши номер замовлення. Якщо замовлення вже передане, застосовуються правила відмови, повернення та обміну, встановлені законом і цією офертою.`,
        "Продавець може скасувати замовлення до відправлення, якщо товар об’єктивно відсутній, оплата не підтверджена або виконання стало неможливим. Про причину повідомляють покупця, а отримані кошти повертають за наявності підстав.",
      ],
    },
    {
      title: "9. Товар належної якості: обмін і повернення",
      paragraphs: [
        "Покупець користується правами на обмін або повернення товару належної якості у випадках, порядку та строки, передбачені чинним законодавством України. Товар має зберігати товарний вигляд, споживчі властивості, пломби, ярлики, комплектність і документ, що підтверджує придбання, якщо закон не передбачає іншого.",
        "Товари належної якості, які відповідно до законодавства належать до категорій, що не підлягають поверненню або обміну, поверненню чи обміну не підлягають. Застосовність винятку визначається чинним на дату звернення нормативним переліком і характеристиками конкретного товару. Постанова КМУ № 172 не називає контактні лінзи окремим буквальним рядком, тому продавець не робить такого автоматичного висновку без правової підстави.",
        "Обмеження щодо повернення або обміну товару належної якості не позбавляє споживача прав у разі продажу товару неналежної якості, дефектного товару, невідповідності замовленню або надання недостовірної інформації про товар.",
      ],
    },
    {
      title: "10. Товар неналежної якості",
      paragraphs: [
        "Вимоги щодо недоліків, дефекту, пошкодження, неправильної комплектації, невідповідності замовленню або недостовірного опису розглядаються окремо від повернення товару належної якості. Покупець має засоби захисту, передбачені законом, залежно від характеру недоліку та підтверджених обставин.",
        `Для звернення слід написати на ${legalConfig.email} або зателефонувати ${legalConfig.phoneDisplay}, описати проблему та, за можливості, додати номер замовлення й матеріали, які дають змогу ідентифікувати невідповідність. Надсилати зайві медичні або платіжні дані не потрібно.`,
      ],
    },
    {
      title: "11. Гарантія",
      paragraphs: [
        "Гарантійний строк і умови застосовуються лише коли вони встановлені законом, виробником або підтвердженою інформацією про конкретний товар. Ця оферта не створює додаткової гарантії, не зазначеної в картці чи документах товару, і не обмежує обов’язкових законних прав покупця.",
      ],
    },
    {
      title: "12. Претензії та спори",
      paragraphs: [
        `Претензію можна направити на ${legalConfig.email}, повідомити телефоном ${legalConfig.phoneDisplay} або надіслати за адресою ${legalConfig.legalAddress}. Продавець розглядає звернення у строки, встановлені законом, і може запросити лише інформацію, потрібну для ідентифікації замовлення та вимоги.`,
        "Сторони намагаються врегулювати спір шляхом комунікації. Це не обмежує право споживача звернутися до компетентного органу або суду.",
      ],
    },
    {
      title: "13. Відповідальність і форс-мажор",
      paragraphs: [
        "Сторони відповідають за порушення зобов’язань у межах закону. Жодне положення оферти не виключає та не звужує відповідальність або права споживача там, де таке виключення заборонене.",
        "Сторона, яка не може виконати зобов’язання через обставини непереборної сили, повідомляє іншу сторону без невиправданої затримки та надає підтвердження, якщо воно вимагається законом. Форс-мажор звільняє від відповідальності лише в доведеній частині й не скасовує вже виконаних платежів або законних вимог автоматично.",
      ],
    },
    {
      title: "14. Персональні дані",
      paragraphs: [
        "Для запису на консультацію, оформлення й виконання замовлення продавець обробляє лише дані, потрібні для відповідної мети. Деталі щодо категорій даних, одержувачів, локального сховища, аналітичної згоди та прав людини наведено в Політиці конфіденційності.",
      ],
    },
    {
      title: "15. Строк дії та зміни",
      paragraphs: [
        "Ця редакція датована 14 серпня 2026 року. Після production-публікації оферта діє з моменту розміщення на сайті до її заміни новою редакцією. Умови, прийняті покупцем, застосовуються до відповідного замовлення; подальші зміни не мають зворотної сили, якщо інше не вимагає закон.",
        "До договору застосовується законодавство України, зокрема законодавство про захист прав споживачів, електронну комерцію та персональні дані.",
      ],
    },
  ],
  sources: offerSources,
};

const ukPrivacy: LegalDocument = {
  title: "Політика конфіденційності — European Ophthalmological Clinic",
  description:
    "Як Med.uz.ua обробляє дані під час запису, телефонного звернення, роботи кошика, checkout та керування згодою.",
  eyebrow: "Конфіденційність і дані",
  statusTitle: "Редакція для юридичної перевірки перед публікацією",
  statusBody:
    "Політика описує поточну реалізацію та окремо позначає ще не активовані commerce-інтеграції. Конкретні строки зберігання залежать від мети, договорів із постачальниками й вимог закону; перед production-публікацією рекомендована перевірка українським юристом.",
  lastUpdatedLabel: "Останнє оновлення",
  lastUpdated: "2026-08-14",
  sections: [
    {
      title: "1. Володілець персональних даних",
      paragraphs: [
        `Володілець персональних даних: ${legalConfig.legalName}. ${legalConfig.taxIdLabel}: ${legalConfig.taxId}. Адреса: ${legalConfig.legalAddress}. Privacy-звернення: ${legalConfig.email}, телефон ${legalConfig.phoneDisplay}.`,
      ],
    },
    {
      title: "2. Які дані обробляються",
      items: [
        "запис на консультацію: ім’я, номер телефону та технічні антибот-поля;",
        "телефонне звернення: номер телефону, службові метадані зв’язку та інформація, яку людина добровільно повідомляє під час розмови;",
        "кошик: ідентифікатори товарів, кількість і технічна версія стану в localStorage браузера;",
        "checkout у поточній реалізації: ідентифікатори товарів, кількість, технічні посилання Nova Poshta на місто та відділення/поштомат; API повертає недоступність і не створює замовлення або платіж;",
        "після окремої активації commerce: дані, необхідні для одержувача, доставки, зв’язку, обліку замовлення, оплати, повернення та претензії;",
        "згода: окремі вибори щодо analytics і advertising, версія політики та час оновлення без імені, телефону чи email;",
        "технічні дані: IP-адреса, user agent, URL, час і відомості безпеки, які можуть міститися в мережевих/runtime logs Cloudflare;",
        "аналітика після відповідної згоди: неперсональні події, шлях сторінки, локаль, розміщення кнопки, код помилки, ідентифікатор/категорія товару, ціна та кількість.",
      ],
      paragraphs: [
        "Сайт не повинен передавати в analytics ім’я, телефон, email, адресу, нотатки пацієнта, вільний текст форми, платіжний payload/signature або Telegram-ідентифікатори.",
      ],
    },
    {
      title: "3. Мета та правові підстави",
      paragraphs: [
        "Дані обробляються, щоб відповісти на запит і узгодити консультацію; виконати дії до укладення договору; після активації — сформувати, оплатити, доставити й супроводити замовлення; виконати обов’язки за законом; розглянути звернення; забезпечити безпеку, доступність і запобігання зловживанням.",
        "Залежно від операції підставою є запит людини до укладення договору, виконання договору, обов’язок за законом, згода або інша підстава, дозволена законодавством. Analytics і advertising не вважаються необхідними для роботи сайту та активуються лише за відповідним вибором користувача.",
      ],
    },
    {
      title: "4. Одержувачі та постачальники",
      paragraphs: [
        "Cloudflare забезпечує hosting, виконання Worker та мережевий захист. Налаштований продавцем lead-сервіс отримує ім’я й телефон лише після успішної перевірки форми. Оператор телефонного зв’язку обробляє технічні дані дзвінка.",
        "Google Maps може отримувати технічні дані під час завантаження карти або переходу за зовнішнім посиланням; підтверджене посилання на Google profile використовується для перегляду або залишення відгуку й відкривається лише за дією користувача.",
        "Google Tag Manager і налаштовані через нього GA4/Google Ads ресурси завантажуються лише після відповідної згоди. LiqPay і Nova Poshta стануть одержувачами потрібних платіжних або доставкових даних лише після окремої production-активації; поточний checkout не звертається до їх API та не створює платіж.",
      ],
    },
    {
      title: "5. Передання за межі України",
      paragraphs: [
        "Cloudflare та сервіси Google можуть обробляти технічні або дозволені аналітичні дані в інших країнах. Конкретне місце, договірні механізми та строки залежать від обраного сервісу й налаштувань акаунта. Власник має перевірити ці налаштування й договори до production-активації необов’язкових тегів.",
      ],
    },
    {
      title: "6. Строки зберігання",
      paragraphs: [
        "Дані зберігаються не довше, ніж потрібно для відповіді на звернення, виконання договору, розгляду вимоги, захисту сервісу та виконання обов’язків за законом. Строк визначається категорією документа, незавершеним зверненням, строком можливих вимог, правилами бухгалтерського або податкового обліку та налаштуваннями відповідного обробника.",
        "Кошик зберігається в браузері до очищення користувачем або технічного скидання. Вибір consent зберігається до його зміни, очищення сховища або інвалідації новою версією політики. Політика навмисно не вигадує фіксовані строки для серверних журналів чи майбутніх замовлень, доки власник не затвердить retention schedule.",
      ],
    },
    {
      title: "7. Cookies, localStorage і Consent Mode v2",
      paragraphs: [
        "Необхідний локальний стан кошика та consent preference зберігаються окремими ключами localStorage. Вони не використовуються для прихованого advertising або analytics tracking.",
        "Реалізація Basic Google Consent Mode v2 не завантажує Google/GTM/GA4/Ads scripts до згоди. До вибору параметри analytics_storage, ad_storage, ad_user_data та ad_personalization мають ефективний стан denied. Користувач може окремо дозволити analytics і advertising, відхилити необов’язкове, знову відкрити налаштування або відкликати вибір.",
        "Після відкликання сайт блокує наступні події, оновлює параметри до denied і очищає site-owned analytics storage/cookies, які контролює. Уже завантажений сторонній script може неможливо повністю вивантажити без перезавантаження; це не дозволяє сайту продовжувати відправлення подій після deny.",
      ],
    },
    {
      title: "8. Google Maps, Google profile та зовнішні ресурси",
      paragraphs: [
        "Контактна сторінка містить lazy-loaded Google Maps iframe. Коли карта завантажується, браузер напряму встановлює з’єднання з Google. Посилання на маршрут або профіль Google відкривається в новій вкладці лише після натискання; подальша обробка відбувається за правилами Google.",
      ],
    },
    {
      title: "9. Права людини та відкликання згоди",
      paragraphs: [
        "У межах закону людина може знати про джерела, місце зберігання, мету й одержувачів даних; отримати доступ; вимагати виправлення або видалення незаконно чи неточно оброблюваних даних; заперечити або обмежити обробку, коли це застосовно; відкликати згоду без впливу на законність попередньої обробки; звернутися до Уповноваженого Верховної Ради України з прав людини або суду.",
        `Щоб реалізувати право, напишіть на ${legalConfig.email} або зверніться за телефоном ${legalConfig.phoneDisplay}. Продавець може попросити мінімальну інформацію для безпечної ідентифікації заявника. Видалення може бути обмежене обов’язком зберегти окремий документ за законом.`,
      ],
    },
    {
      title: "10. Принципи безпеки",
      paragraphs: [
        "Застосовуються мінімізація даних, strict server-side validation, обмеження розміру запитів, same-origin checks, серверне зберігання integration secrets і заборона PII в analytics events. Доступ до даних має надаватися лише тим, кому він потрібний для визначеної мети.",
        "Жоден онлайн-сервіс не може гарантувати абсолютну безпеку. Про інциденти й запити щодо даних слід повідомляти через privacy-контакти, щоб власник міг оцінити ситуацію та виконати застосовні обов’язки.",
      ],
    },
    {
      title: "11. Контакти та оновлення",
      paragraphs: [
        `Privacy-звернення: ${legalConfig.email}; телефон ${legalConfig.phoneDisplay}; адреса ${legalConfig.legalAddress}. Не надсилайте через email або форму запису медичні документи, дані картки чи іншу зайву чутливу інформацію.`,
        "Останнє оновлення: 14 серпня 2026 року. Істотні зміни мають публікуватися як нова редакція; якщо нова мета потребує згоди, сайт запитує її окремо.",
      ],
    },
  ],
  sources: privacySources,
};

interface InformationalCopy {
  readonly offerTitle: string;
  readonly privacyTitle: string;
  readonly offerDescription: string;
  readonly privacyDescription: string;
  readonly eyebrow: string;
  readonly statusTitle: string;
  readonly statusBody: string;
  readonly notice: string;
  readonly updatedLabel: string;
  readonly offerSections: readonly (readonly [string, string])[];
  readonly privacySections: readonly (readonly [string, string])[];
}

const informationalCopy: Readonly<
  Record<Exclude<Locale, "uk">, InformationalCopy>
> = {
  en: {
    offerTitle: "Public Offer — informational English version",
    privacyTitle: "Privacy Policy — informational English version",
    offerDescription: "A complete informational summary of the controlling Ukrainian online-sales terms.",
    privacyDescription: "A complete informational summary of the controlling Ukrainian privacy policy.",
    eyebrow: "Legal information",
    statusTitle: "Informational translation — legal review recommended",
    statusBody: "The Ukrainian document controls. Seller details were supplied by the owner; Ukrainian counsel should review the terms before production publication. Online checkout currently remains unavailable.",
    notice: "This translation is provided for convenience. If wording differs, the Ukrainian version controls.",
    updatedLabel: "Last updated",
    offerSections: [
      ["1. Seller and scope", `Seller: ${legalConfig.legalName}; ${legalConfig.taxIdLabel}: ${legalConfig.taxId}; legal and operating address: ${legalConfig.legalAddress}; phone ${legalConfig.phoneDisplay}; email ${legalConfig.email}. The terms govern remote goods sales only; medical services remain separate.`],
      ["2. Goods and contract formation", "The confirmed product, quantity, characteristics and price define the order. A local cart neither reserves goods nor forms a contract. Once checkout is enabled, the clearly labelled final action constitutes acceptance after the buyer can correct data and review the total; the contract forms when the seller’s system receives that acceptance and promptly confirms receipt."],
      ["3. Price and payment", "Prices and totals are in UAH and are rebuilt from the server catalogue. Available payment methods are shown before acceptance. LiqPay is used only if offered by the active checkout; a click is not payment, and success requires provider confirmation plus server verification. Refunds follow law and applicable provider rules."],
      ["4. Delivery, transfer and inspection", "If Nova Poshta is offered, supported location, branch/locker, cost and available timing are shown or confirmed before acceptance. Goods and accidental-loss risk pass on actual receipt unless mandatory law provides otherwise. The buyer should inspect model, quantity, completeness, packaging and visible condition; failure to inspect does not waive non-excludable rights."],
      ["5. Cancellation, returns and proper-quality goods", `Before dispatch, cancellation can be requested at ${legalConfig.email} or ${legalConfig.phoneDisplay}. Proper-quality exchange/return follows Ukrainian law. Items legally included in a non-returnable category are treated accordingly, but Resolution No. 172 does not literally list “contact lenses”, so the seller does not infer that result without a legal basis.`],
      ["6. Defective or non-conforming goods", "A restriction concerning proper-quality goods never removes remedies for defective, damaged, misdescribed, incomplete or non-conforming goods. Statutory remedies depend on the defect and proven circumstances. Warranty exists only where law, manufacturer documents or verified product terms provide it."],
      ["7. Claims, liability and force majeure", `Claims may be sent to ${legalConfig.email}, made by phone ${legalConfig.phoneDisplay}, or mailed to ${legalConfig.legalAddress}. Liability and complaint periods follow mandatory law. Force majeure applies only to the proven affected obligation and does not automatically erase accrued rights or payments.`],
      ["8. Personal data", "Appointment, order and delivery data are handled only for stated purposes under the Privacy Policy. Optional analytics/advertising require the relevant choice and must not receive personal appointment, contact, shipping or payment payloads."],
      ["9. Term and governing law", "Revision date: 14 August 2026. After production publication, the terms remain effective until replaced; a later revision does not retroactively change an accepted order unless law requires it. Ukrainian consumer, e-commerce and data-protection law applies."],
    ],
    privacySections: [
      ["1. Controller", `Controller: ${legalConfig.legalName}; ${legalConfig.taxIdLabel}: ${legalConfig.taxId}; address ${legalConfig.legalAddress}; privacy email ${legalConfig.email}; phone ${legalConfig.phoneDisplay}.`],
      ["2. Data collected", "The appointment form handles name, phone and technical anti-bot fields; calls involve the caller’s number and voluntarily shared content; the browser stores cart product IDs/quantities; consent stores analytics/advertising choices, version and update time. Cloudflare may process IP, user agent, URL, time and security metadata. The current checkout validates cart and Nova Poshta location references but returns unavailable and creates neither an order nor a payment."],
      ["3. Purposes and legal bases", "Data is used to answer requests, take pre-contract steps, perform an activated order, meet legal duties, handle claims and protect the service. The applicable basis may be a request, contract, legal duty, consent or another basis allowed by law. Optional analytics and advertising are not necessary and require the matching user choice."],
      ["4. Recipients and integrations", "Cloudflare hosts and protects the site; the configured lead destination receives validated appointment contact data; telecom providers handle calls. Google Maps connects when the lazy map loads or a user opens a map link; the Google profile/review link opens only on user action. GTM/GA4/Ads load only after corresponding consent. LiqPay and Nova Poshta receive data only after a separate production activation."],
      ["5. International processing", "Cloudflare and Google may process permitted technical or analytics data outside Ukraine. Exact locations, safeguards and retention depend on provider and account configuration and must be reviewed before optional tags are enabled in production."],
      ["6. Retention", "Data is retained only while needed for the request, contract, claim, service security and legal duties. The cart remains until browser clearing or technical reset; consent remains until changed, cleared or policy-version invalidation. No unsupported fixed period is promised for runtime logs or future orders."],
      ["7. Storage and Basic Consent Mode v2", "Cart and consent use separate localStorage keys. Before consent, Google/GTM/GA4/Ads scripts do not load and analytics_storage, ad_storage, ad_user_data and ad_personalization are effectively denied. Users can accept all, allow analytics only, reject non-essential processing, reopen preferences or withdraw. Withdrawal blocks future events and clears site-controlled analytics storage/cookies; an already loaded external script may require reload to unload fully."],
      ["8. Analytics minimisation", "Allowed analytics events are deterministic and non-PII. Names, phone numbers, email, patient notes, addresses, free text, payment payload/signature and Telegram identifiers must not be sent. Appointment success is emitted only after API success; payment purchase requires server-verified payment."],
      ["9. Rights and security", "Subject to law, a person may request information, access, correction or deletion, object or seek restriction, withdraw consent, and complain to the Ukrainian Parliament Commissioner for Human Rights or a court. The site applies data minimisation, strict validation, request limits, same-origin checks and server-only secrets, without claiming absolute security."],
      ["10. Contact and update", `Send privacy requests to ${legalConfig.email}, call ${legalConfig.phoneDisplay}, or write to ${legalConfig.legalAddress}. Do not send unnecessary medical records or card data. Last updated 14 August 2026; a materially new consent-based purpose requires a new choice.`],
    ],
  },
  sk: {
    offerTitle: "Verejná ponuka — informačná slovenská verzia",
    privacyTitle: "Zásady ochrany súkromia — informačná slovenská verzia",
    offerDescription: "Úplné informačné zhrnutie rozhodujúcich ukrajinských podmienok online predaja.",
    privacyDescription: "Úplné informačné zhrnutie rozhodujúcich ukrajinských zásad ochrany súkromia.",
    eyebrow: "Právne informácie",
    statusTitle: "Informačný preklad — odporúča sa právna kontrola",
    statusBody: "Rozhodujúci je ukrajinský dokument. Údaje predávajúceho poskytol vlastník; pred production publikáciou sa odporúča kontrola ukrajinským právnikom. Online checkout je momentálne nedostupný.",
    notice: "Preklad slúži na uľahčenie orientácie. Pri rozdiele je rozhodujúca ukrajinská verzia.",
    updatedLabel: "Posledná aktualizácia",
    offerSections: [
      ["1. Predávajúci a rozsah", `Predávajúci: ${legalConfig.legalName}; ${legalConfig.taxIdLabel}: ${legalConfig.taxId}; právna aj prevádzková adresa: ${legalConfig.legalAddress}; telefón ${legalConfig.phoneDisplay}; e-mail ${legalConfig.email}. Podmienky upravujú iba diaľkový predaj tovaru; zdravotné služby sú samostatné.`],
      ["2. Tovar a vznik zmluvy", "Objednávku určuje potvrdený tovar, množstvo, vlastnosti a cena. Lokálny košík tovar nerezervuje ani nevytvára zmluvu. Po aktivácii checkoutu je jasne označený záverečný úkon akceptáciou po možnosti opraviť údaje a skontrolovať sumu; zmluva vzniká prijatím akceptácie systémom predávajúceho, ktorý bezodkladne potvrdí prijatie."],
      ["3. Cena a platba", "Ceny a súčty sú v UAH a server ich overuje podľa katalógu. Dostupný spôsob platby sa zobrazí pred akceptáciou. LiqPay sa použije iba ak ho ponúka aktívny checkout; kliknutie nie je platba a úspech vyžaduje potvrdenie poskytovateľa a servera. Refundácia sa riadi právom a pravidlami poskytovateľa."],
      ["4. Doručenie, odovzdanie a kontrola", "Ak je dostupná Nova Poshta, podporované mesto, pobočka/box, cena a dostupný termín sa zobrazia alebo potvrdia pred akceptáciou. Tovar a riziko prechádzajú pri skutočnom prevzatí, ak kogentné právo neurčí inak. Kupujúci má skontrolovať model, množstvo, kompletnosť, obal a viditeľný stav; neuskutočnenie kontroly neruší neodňateľné práva."],
      ["5. Zrušenie a tovar riadnej kvality", `Pred odoslaním možno požiadať o zrušenie na ${legalConfig.email} alebo ${legalConfig.phoneDisplay}. Výmena/vrátenie tovaru riadnej kvality sa riadi ukrajinským právom. Zákonné nevymeniteľné kategórie sa posudzujú podľa aktuálneho zoznamu; uznesenie č. 172 doslova neuvádza „kontaktné šošovky“, preto sa taký záver nerobí bez právneho základu.`],
      ["6. Vadný alebo nezhodný tovar", "Obmedzenie pre tovar riadnej kvality nikdy neruší práva pri vadnom, poškodenom, nesprávne opísanom, neúplnom alebo nezhodnom tovare. Zákonné nároky závisia od vady a preukázaných okolností. Záruka platí len podľa zákona, dokumentov výrobcu alebo overených podmienok produktu."],
      ["7. Reklamácie a zodpovednosť", `Reklamáciu možno poslať na ${legalConfig.email}, oznámiť na ${legalConfig.phoneDisplay} alebo poštou na ${legalConfig.legalAddress}. Lehoty a zodpovednosť sa riadia kogentným právom. Vyššia moc sa týka len preukázane dotknutého záväzku a automaticky neruší vzniknuté práva ani platby.`],
      ["8. Osobné údaje", "Údaje o termíne, objednávke a doručení sa spracúvajú iba na uvedené účely podľa zásad ochrany súkromia. Voliteľná analytika/reklama vyžaduje príslušnú voľbu a nesmie dostať osobné kontaktné, zdravotné, doručovacie ani platobné payloady."],
      ["9. Účinnosť a právo", "Dátum revízie: 14. august 2026. Po production publikácii podmienky platia do nahradenia; novšia verzia spätne nemení prijatú objednávku, ak to nevyžaduje zákon. Uplatňuje sa ukrajinské spotrebiteľské, e-commerce a dátové právo."],
    ],
    privacySections: [
      ["1. Prevádzkovateľ", `Prevádzkovateľ: ${legalConfig.legalName}; ${legalConfig.taxIdLabel}: ${legalConfig.taxId}; adresa ${legalConfig.legalAddress}; privacy e-mail ${legalConfig.email}; telefón ${legalConfig.phoneDisplay}.`],
      ["2. Spracúvané údaje", "Formulár spracúva meno, telefón a technické anti-bot polia; hovory číslo a dobrovoľne oznámený obsah; prehliadač ID/množstvá košíka; consent voľby analytics/advertising, verziu a čas. Cloudflare môže spracúvať IP, user agent, URL, čas a bezpečnostné metadata. Aktuálny checkout validuje košík a referencie mesta/pobočky Nova Poshta, ale vráti nedostupnosť a nevytvorí objednávku ani platbu."],
      ["3. Účely a právne základy", "Údaje slúžia na odpoveď, predzmluvné kroky, aktivovanú objednávku, zákonné povinnosti, reklamácie a ochranu služby. Základom môže byť žiadosť, zmluva, právna povinnosť, súhlas alebo iný zákonný základ. Voliteľná analytika a reklama nie sú nevyhnutné a vyžadujú zodpovedajúcu voľbu."],
      ["4. Príjemcovia", "Cloudflare hostuje a chráni web; nastavený lead cieľ dostane validované kontaktné údaje; telekomunikačný operátor technické údaje hovoru. Google Maps sa pripojí pri načítaní mapy alebo otvorení odkazu; Google profile/review odkaz len po úkone používateľa. GTM/GA4/Ads sa načítajú až po súhlase. LiqPay a Nova Poshta dostanú údaje až po samostatnej production aktivácii."],
      ["5. Medzinárodné spracúvanie", "Cloudflare a Google môžu spracúvať povolené technické alebo analytické údaje mimo Ukrajiny. Miesto, záruky a retencia závisia od poskytovateľa a nastavenia účtu a pred production aktiváciou nepovinných tagov sa musia skontrolovať."],
      ["6. Uchovávanie", "Údaje sa držia iba po dobu potrebnú na žiadosť, zmluvu, nárok, bezpečnosť a zákonné povinnosti. Košík trvá do vyčistenia alebo resetu; consent do zmeny, vyčistenia alebo zneplatnenia verziou politiky. Pevná neoverená doba pre logs ani budúce objednávky sa nesľubuje."],
      ["7. Úložisko a Basic Consent Mode v2", "Košík a consent používajú oddelené localStorage kľúče. Pred súhlasom sa Google/GTM/GA4/Ads skripty nenačítajú a analytics_storage, ad_storage, ad_user_data a ad_personalization sú denied. Možno povoliť všetko, len analytiku, odmietnuť, znovu otvoriť voľby alebo odvolať súhlas. Odvolanie blokuje ďalšie udalosti a čistí webom riadené analytics storage/cookies; úplné odstránenie načítaného scriptu môže vyžadovať reload."],
      ["8. Minimalizácia analytiky", "Povolené udalosti sú deterministické a bez PII. Meno, telefón, e-mail, poznámky pacienta, adresa, voľný text, platobný payload/signature ani Telegram ID sa neposielajú. Appointment success až po API success; purchase až po serverom overenej platbe."],
      ["9. Práva a bezpečnosť", "Podľa práva možno žiadať informácie, prístup, opravu alebo vymazanie, namietať alebo obmedziť, odvolať súhlas a sťažovať sa ukrajinskému ombudsmanovi alebo súdu. Web používa minimalizáciu, striktnú validáciu, limity, same-origin checks a serverové secrets bez sľubu absolútnej bezpečnosti."],
      ["10. Kontakt a aktualizácia", `Žiadosti posielajte na ${legalConfig.email}, volajte ${legalConfig.phoneDisplay} alebo píšte na ${legalConfig.legalAddress}. Neposielajte nepotrebné zdravotné dokumenty ani údaje karty. Aktualizované 14. augusta 2026; nový účel založený na súhlase vyžaduje novú voľbu.`],
    ],
  },
  hu: {
    offerTitle: "Nyilvános ajánlat — tájékoztató magyar változat",
    privacyTitle: "Adatvédelmi szabályzat — tájékoztató magyar változat",
    offerDescription: "Az irányadó ukrán online értékesítési feltételek teljes tájékoztató összefoglalója.",
    privacyDescription: "Az irányadó ukrán adatvédelmi szabályzat teljes tájékoztató összefoglalója.",
    eyebrow: "Jogi tájékoztatás",
    statusTitle: "Tájékoztató fordítás — jogi ellenőrzés ajánlott",
    statusBody: "Az ukrán dokumentum az irányadó. Az eladói adatokat a tulajdonos adta meg; production közzététel előtt ukrán jogi felülvizsgálat ajánlott. Az online checkout jelenleg nem érhető el.",
    notice: "A fordítás a tájékozódást segíti. Eltérés esetén az ukrán változat az irányadó.",
    updatedLabel: "Utolsó frissítés",
    offerSections: [
      ["1. Eladó és hatály", `Eladó: ${legalConfig.legalName}; ${legalConfig.taxIdLabel}: ${legalConfig.taxId}; jogi és működési cím: ${legalConfig.legalAddress}; telefon ${legalConfig.phoneDisplay}; e-mail ${legalConfig.email}. A feltételek csak a távértékesítésre vonatkoznak; az egészségügyi szolgáltatások külön jogviszonyt alkotnak.`],
      ["2. Termék és szerződéskötés", "A megrendelést a visszaigazolt termék, mennyiség, jellemzők és ár határozzák meg. A helyi kosár nem foglal és nem köt szerződést. A checkout aktiválása után az egyértelműen jelölt végső művelet az adatok és összeg javítható ellenőrzése után elfogadás; a szerződés akkor jön létre, amikor az eladó rendszere megkapja ezt, és haladéktalanul visszaigazolja az átvételt."],
      ["3. Ár és fizetés", "Az árak és végösszegek UAH-ban vannak, a szerver a katalógusból ellenőrzi őket. Az elérhető fizetés az elfogadás előtt látható. A LiqPay csak aktív checkoutban használható; a kattintás nem fizetés, a sikerhez szolgáltatói és szerveres igazolás kell. A visszatérítésre a jog és a szolgáltatói szabályok irányadók."],
      ["4. Szállítás, átadás és ellenőrzés", "Ha a Nova Poshta elérhető, a támogatott település, fiók/automata, díj és idő az elfogadás előtt látható vagy visszaigazolt. A termék és a kárveszély tényleges átvételkor száll át, ha kötelező jog másként nem rendelkezik. A vevő ellenőrizze a modellt, mennyiséget, teljességet, csomagolást és látható állapotot; ennek elmulasztása nem vonja el a kötelező jogokat."],
      ["5. Lemondás és megfelelő minőségű áru", `Feladás előtt lemondás kérhető a ${legalConfig.email} címen vagy a ${legalConfig.phoneDisplay} számon. A megfelelő minőségű áru cseréjét/visszaküldését az ukrán jog rendezi. A törvény szerinti nem visszaváltható kategóriák az aktuális lista alapján bírálandók el; a 172. határozat szó szerint nem nevezi meg a „kontaktlencsét”, ezért az eladó ezt jogalap nélkül nem feltételezi.`],
      ["6. Hibás vagy nem megfelelő áru", "A megfelelő minőségű árura vonatkozó korlát soha nem szünteti meg a hibás, sérült, félreírt, hiányos vagy nem megfelelő termékhez kapcsolódó jogokat. A jogorvoslat a hibától és a bizonyított körülményektől függ. Jótállás csak jogszabály, gyártói dokumentum vagy ellenőrzött termékfeltétel alapján van."],
      ["7. Panasz és felelősség", `Panasz küldhető a ${legalConfig.email} címre, jelezhető a ${legalConfig.phoneDisplay} számon vagy postán a ${legalConfig.legalAddress} címre. A határidők és felelősség kötelező jog szerint alakulnak. A vis maior csak a bizonyítottan érintett kötelezettségre vonatkozik, és nem törli automatikusan a megszerzett jogokat vagy fizetéseket.`],
      ["8. Személyes adatok", "Az időpont-, rendelési és szállítási adatokat csak a megjelölt célra, az adatvédelmi szabályzat szerint kezeljük. Az opcionális analitika/reklám megfelelő választást igényel, és nem kaphat személyes kapcsolat-, egészségügyi, szállítási vagy fizetési payloadot."],
      ["9. Hatály és jog", "Felülvizsgálat dátuma: 2026. augusztus 14. Production közzététel után a feltételek lecserélésig hatályosak; újabb változat visszamenőleg nem módosít elfogadott rendelést, kivéve ha jog írja elő. Az ukrán fogyasztóvédelmi, e-kereskedelmi és adatvédelmi jog alkalmazandó."],
    ],
    privacySections: [
      ["1. Adatkezelő", `Adatkezelő: ${legalConfig.legalName}; ${legalConfig.taxIdLabel}: ${legalConfig.taxId}; cím ${legalConfig.legalAddress}; privacy e-mail ${legalConfig.email}; telefon ${legalConfig.phoneDisplay}.`],
      ["2. Kezelt adatok", "Az időpontűrlap nevet, telefont és technikai anti-bot mezőket; a hívás telefonszámot és önként közölt tartalmat; a böngésző kosár-ID-ket/mennyiséget; a consent analytics/advertising választást, verziót és időt kezel. A Cloudflare IP-t, user agentet, URL-t, időt és biztonsági metaadatot kezelhet. A jelenlegi checkout kosarat és Nova Poshta település/fiók referenciát validál, de unavailable választ ad, rendelést és fizetést nem hoz létre."],
      ["3. Cél és jogalap", "Az adatok megkeresés megválaszolására, szerződés előtti lépésekre, aktivált rendelésre, jogi kötelezettségre, panaszra és védelemre szolgálnak. Jogalap lehet kérés, szerződés, jogi kötelezettség, hozzájárulás vagy más megengedett alap. Az opcionális analitika és reklám nem szükséges, és a megfelelő választást igényli."],
      ["4. Címzettek", "A Cloudflare hostol és véd; a beállított lead cél a validált kapcsolatot; a távközlési szolgáltató a hívás technikai adatait kapja. A Google Maps térképbetöltéskor vagy linknyitáskor kapcsolódik; a Google profile/review link csak felhasználói műveletre nyílik. GTM/GA4/Ads csak hozzájárulás után töltődik be. LiqPay és Nova Poshta csak külön production aktiválás után kap adatot."],
      ["5. Nemzetközi kezelés", "A Cloudflare és a Google engedélyezett technikai vagy analitikai adatot Ukrajnán kívül is kezelhet. A hely, garancia és megőrzés a szolgáltatótól és fiókbeállítástól függ, ezért opcionális tagek production aktiválása előtt ellenőrizendő."],
      ["6. Megőrzés", "Az adat csak a kéréshez, szerződéshez, igényhez, biztonsághoz és jogi kötelezettséghez szükséges ideig marad. A kosár törlésig/resetig; a consent módosításig, törlésig vagy policy-version érvénytelenítésig. Runtime logokra és jövőbeli rendelésekre nem állítunk nem igazolt fix időt."],
      ["7. Tárolás és Basic Consent Mode v2", "A kosár és consent külön localStorage-kulcsot használ. Hozzájárulás előtt Google/GTM/GA4/Ads script nem töltődik, az analytics_storage, ad_storage, ad_user_data és ad_personalization denied. Engedélyezhető minden vagy csak analytics, elutasítható, újranyitható vagy visszavonható. Visszavonás blokkolja a további eseményt és törli a webhely által kezelt analytics storage/cookie elemeket; a már betöltött script teljes eltávolításához reload kellhet."],
      ["8. Analitikai minimalizálás", "Az engedélyezett esemény determinisztikus és PII-mentes. Név, telefon, e-mail, betegjegyzet, cím, szabad szöveg, fizetési payload/signature és Telegram ID nem küldhető. Appointment success csak API success után; purchase csak szerver által ellenőrzött fizetés után."],
      ["9. Jogok és biztonság", "Jog szerint tájékoztatás, hozzáférés, helyesbítés vagy törlés, tiltakozás vagy korlátozás, hozzájárulás-visszavonás, ombudsmani vagy bírósági panasz kérhető. A web minimalizálást, szigorú validációt, limiteket, same-origin checks és szerveres secrets használ, abszolút biztonság ígérete nélkül."],
      ["10. Kapcsolat és frissítés", `Kérelmek: ${legalConfig.email}, ${legalConfig.phoneDisplay}, vagy ${legalConfig.legalAddress}. Felesleges egészségügyi dokumentumot vagy kártyaadatot ne küldjön. Frissítve: 2026. augusztus 14.; új consent-alapú cél új választást igényel.`],
    ],
  },
};

function informationalDocument(
  locale: Exclude<Locale, "uk">,
  kind: LegalDocumentKind,
): LegalDocument {
  const localized = informationalCopy[locale];
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
    lastUpdatedLabel: localized.updatedLabel,
    lastUpdated: "2026-08-14",
    informationalNotice: localized.notice,
    controllingHref: isOffer ? "/offer" : "/privacy",
    sections: tuples.map(([title, paragraph]) => ({
      title,
      paragraphs: [paragraph],
    })),
    sources: isOffer ? offerSources : privacySources,
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
