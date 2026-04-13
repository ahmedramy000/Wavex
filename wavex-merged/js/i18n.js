// ════════════════════════════════════════
//  Wavex i18n — Bilingual AR / EN System
//  To add a language: add new key to LANGS
// ════════════════════════════════════════

const LANGS = {
  ar: {
    friendRequestSent:     'اتبعت الريكوست! 📨',
    friendRequestAccepted: 'اتقبل الطلب! 🎉',
    requestDeclined:       'اترفض الطلب',
    reportSubmitted:       'اتبعت البلاغ، شكراً! 🚩',
    preferencesSaved:      'اتحفظ التخصيص! ✅',
    fontChanged:           'اتغير حجم الخط',
    friends:               'الفريندز',
    // Meta
    tagline: 'تواصل بشكل مختلف · Connect Differently',
    // Auth
    welcomeBack: 'أهلاً بيك تاني 👋',
    createAccount: 'اعمل حساب جديد',
    username: 'اسم المستخدم',
    password: 'الباسورد',
    fullName: 'اسمك إيه؟',
    email: 'البريد الإلكتروني',
    rememberMe: 'فاكرني',
    forgotPw: 'نسيت الباسورد؟',
    loginBtn: 'دخول',
    or: 'أو',
    demoLogin: 'دخول تجريبي',
    noAccount: 'مش عندك حساب؟',
    signUpNow: 'اعمل حساب دلوقتي',
    chooseAvatar: 'صورة شخصية — ارفع صورة أو اختار إيموجي',
    agreeTerms: 'أوافق على الشروط والأحكام',
    createBtn: 'اعمل الحساب',
    haveAccount: 'عندك حساب؟',
    loginLink: 'سجل دخول',
    // Nav
    home: 'الهوم',
    myProfile: 'ملفي',
    explore: 'بحث',
    chat: 'الرسايل',
    notifications: 'الإشعارات',
    // Feed
    all: 'الكل',
    following: 'المتابَعون',
    whatsOnMind: 'إيه اللي في بالك؟',
    emoji: 'إيموجي',
    photo: 'صورة',
    publish: 'انشر',
    // Profile
    posts: 'منشورات',
    liked: 'الإعجابات',
    media: 'الوسائط',
    followers: 'متابع',
    editProfile: 'تعديل الملف',
    share: 'شير',
    changeCover: 'تغيير الغلاف',
    defaultBio: 'أهلاً بكم في ملفي الشخصي 🌊',
    // Explore
    searchPh: 'ابحث عن أشخاص أو منشورات...',
    trendingPosts: 'الأكثر تفاعلاً',
    suggestedPeople: 'أشخاص قد تعرفهم',
    // Chat
    searchConvs: 'ابحث في المحادثات...',
    noConvs: 'لا توجد محادثات بعد',
    startChat: 'ابدأ محادثة',
    selectConv: 'اختر محادثة للبدء',
    orStartNew: 'أو ابدأ محادثة جديدة',
    newMsg: 'رسالة جديدة',
    typeMsg: 'اكتب رسالتك...',
    send: 'إرسال',
    // Notifications
    clearAll: 'مسح الكل',
    // Right panel
    suggestions: 'مقترح عليك',
    trendingNow: 'ترند الآن',
    verificationTitle: 'التوثيق',
    verificationDesc: 'احصل على علامة التوثيق ✓ لحسابك',
    applyVerif: 'تقديم طلب توثيق',
    memories: 'ذكريات اليوم',
    noMemories: 'لا توجد ذكريات بعد',
    // Post actions
    like: 'أعجبني',
    comment: 'كومنت',
    sharePost: 'شير',
    delete: 'حذف',
    report: 'إبلاغ',
    // Toast messages
    postCreated: 'تم نشر المنشور! 🎉',
    postDeleted: 'تم حذف المنشور',
    commentAdded: 'تم إضافة تعليقك! 💬',
    loginSuccess: 'أهلاً بك! 👋',
    loggedOut: 'تم الخروج بنجاح',
    profileUpdated: 'تم تحديث الملف الشخصي ✅',
    writeFirst: 'اكتب شيئاً أولاً!',
    writeComment: 'اكتب تعليقاً أولاً',
    fillAll: 'من فضلك أدخل جميع البيانات',
    pwShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    userExists: 'اسم المستخدم موجود بالفعل',
    badCreds: 'بيانات خاطئة',
    acceptTerms: 'يجب قبول الشروط والأحكام',
    msgSent: 'تم إرسال الرسالة ✈️',
    writeMsgFirst: 'اكتب رسالة أولاً',
    verifApplied: 'تم تقديم طلب التوثيق! سيتم مراجعته خلال 3-5 أيام 🛡️',
    followed: 'تمت المتابعة! 🎉',
    unfollowed: 'تم إلغاء المتابعة',
    copied: 'تم النسخ! 📋',
    reported: 'تم الإبلاغ عن المنشور 🚩',
    shareComingSoon: 'مشاركة الملف الشخصي قريباً! 🔗',
    // Modal titles
    addComment: 'إضافة تعليق',
    editProfileTitle: 'تعديل الملف الشخصي',
    newChatTitle: 'محادثة جديدة',
    verificationApply: 'طلب التوثيق',
    // Verification modal
    verifModalDesc: 'الحسابات الموثقة تحصل على علامة ✓ وتظهر في نتائج البحث بشكل أفضل.',
    verifRequirements: 'المتطلبات:',
    verifReq1: '• حساب عمره أكثر من 30 يوم',
    verifReq2: '• صورة شخصية واضحة',
    verifReq3: '• نشاط منتظم على المنصة',
    submitApplication: 'تقديم الطلب',
    // Edit profile
    nameLabel: 'الاسم',
    bioLabel: 'النبذة الشخصية',
    bioPlaceholder: 'اكتب نبذة عن نفسك...',
    saveChanges: 'حفظ التغييرات',
    // Pw strength
    pwWeak: 'ضعيفة',
    pwFair: 'مقبولة',
    pwGood: 'جيدة',
    pwStrong: 'قوية جداً ✓',
    // Misc
    justNow: 'الآن',
    minAgo: 'دقيقة',
    minsAgo: 'دقائق',
    hourAgo: 'ساعة',
    hoursAgo: 'ساعات',
    dayAgo: 'يوم',
    daysAgo: 'أيام',
    ago: 'منذ',
    online: 'متاح الآن',
    offline: 'غير متاح',
    typing: 'بيكتب...',
    selectUser: 'اختر مستخدم للمحادثة',
    searchUsers: 'ابحث عن مستخدم...',
    noUsersFound: 'لا يوجد مستخدمون',
    startConversation: 'ابدأ المحادثة',
    verified: 'موثق',
    writePost: 'اكتب حاجة...',
    submitComment: 'إرسال التعليق',
    // Nav extras
    market: 'الماركت',
    videos: 'الفيديوهات',
    groups: 'الجروبات',
    saved: 'المحفوظات',
    settings: 'الإعدادات',
    // Market
    forSale: 'للبيع',
    wanted: 'مطلوب',
    marketTitle: 'اسم المنتج أو العرض...',
    marketDesc: 'وصف المنتج، الحالة، موقع الاستلام...',
    price: 'السعر',
    addPhoto: 'إضافة صورة',
    publishItem: 'نشر العرض',
    noMarketItems: 'لا توجد عروض بعد — أضف أول عرض!',
    contactSeller: 'تواصل',
    savedItem: 'تم الحفظ 🔖',
    // Videos
    myVideos: 'فيديوهاتي',
    videoTitle: 'عنوان الفيديو...',
    videoDesc: 'وصف الفيديو...',
    uploadVideo: 'رفع فيديو',
    youtubeLink: 'رابط يوتيوب',
    publishVideo: 'انشر',
    noVideos: 'لا توجد فيديوهات بعد',
    addYoutubeLink: 'أضف رابط يوتيوب',
    // Groups
    createGroup: 'إنشاء مجموعة',
    noGroups: 'لا توجد مجموعات بعد',
    createGroupHint: 'أنشئ مجموعة وادعُ أصدقاءك',
    groupName: 'اسم المجموعة...',
    groupDesc: 'وصف المجموعة...',
    // Saved
    noSaved: 'لا توجد منشورات محفوظة',
    savePost: 'احفظ',
    unsavePost: 'إزالة من المحفوظات',
    // Settings
    accountSettings: 'إعدادات الحساب',
    editProfileSub: 'الاسم والصورة والنبذة',
    changePassword: 'تغيير كلمة المرور',
    changePasswordSub: 'حافظ على أمان حسابك',
    privacySettings: 'الخصوصية والأمان',
    privacySettingsSub: 'من يرى منشوراتك وملفك',
    appearance: 'المظهر',
    theme: 'الثيم',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    dark: 'داكن',
    light: 'فاتح',
    accentColor: 'لون التمييز',
    accentColorSub: 'لون الأزرار والروابط',
    fontSize: 'حجم الخط',
    small: 'صغير',
    medium: 'متوسط',
    large: 'كبير',
    languageSettings: 'اللغة',
    language: 'لغة التطبيق',
    notificationSettings: 'إعدادات الإشعارات',
    likesNotif: 'إشعارات الإعجابات',
    commentsNotif: 'إشعارات التعليقات',
    followersNotif: 'إشعارات المتابعين',
    messagesNotif: 'إشعارات الرسائل',
    about: 'عن التطبيق',
    appVersion: 'إصدار التطبيق',
    termsAndPrivacy: 'الشروط والخصوصية',
    deleteAccount: 'حذف الحساب',
    deleteAccountSub: 'هذا الإجراء لا يمكن التراجع عنه',
    logout: 'خروج',
    settingsSaved: 'تم حفظ الإعدادات ✅',
    confirmDeleteAccount: 'هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع!',
    passwordChanged: 'تم تغيير كلمة المرور ✅',
    wrongPassword: 'كلمة المرور الحالية غير صحيحة',
    pwMismatch: 'كلمات المرور غير متطابقة',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
    marketItemPosted: 'تم نشر العرض! 🛒',
    videoPosted: 'تم نشر الفيديو! 🎬',
    fillMarketFields: 'أدخل اسم المنتج والسعر',
    fillVideoFields: 'أدخل عنوان الفيديو',
    itemSavedToBookmarks: 'تم الحفظ في المحفوظات 🔖',
    // Profile extras
    aboutTab: 'معلومات',
    profileLocation: 'الموقع',
    profileWebsite: 'الموقع الإلكتروني',
    profileBirthday: 'تاريخ الميلاد',
    profileJob: 'المسمى الوظيفي',
    profileJoined: 'انضم في',
    locationPh: 'مثلاً: القاهرة، مصر',
    websitePh: 'https://example.com',
    birthdayPh: 'تاريخ الميلاد',
    jobPh: 'المسمى الوظيفي أو الشركة',
    coverUploaded: 'تم تحديث الغلاف ✅',
    coverTooLarge: 'الصورة أكبر من 20 ميجا',
    avatarTooLarge: 'الصورة أكبر من 20 ميجا',
    // Settings new keys
    changeUsername: 'تغيير اسم المستخدم',
    changeEmail: 'تغيير الإيميل',
    dndMode: 'وضع عدم الإزعاج',
    dndSub: 'إيقاف كل الإشعارات مؤقتاً',
    dndOn: 'وضع عدم الإزعاج مفعّل 🔕',
    dndOff: 'الإشعارات مفعّلة 🔔',
    newUsername: 'اسم المستخدم الجديد',
    newEmail: 'الإيميل الجديد',
    usernameTaken: 'اسم المستخدم موجود بالفعل',
    usernameInvalid: 'اسم المستخدم: أحرف وأرقام و _ فقط',
    usernameChanged: 'تم تغيير اسم المستخدم ✅',
    emailChanged: 'تم تغيير الإيميل ✅',
    emailInvalid: 'إيميل غير صحيح',
    confirmWithPassword: 'أدخل كلمة المرور للتأكيد',
    // Multi-account
    accounts: 'الحسابات',
    addAccount: 'إضافة حساب جديد',
    addAccountSub: 'سجل دخول بحساب آخر',
    switchAccount: 'تبديل الحساب',
    accountsManagement: 'إدارة الحسابات',
    // Storage
    storageData: 'التخزين والبيانات',
    storageUsed: 'مساحة مستخدمة',
    clearCache: 'مسح الكاش والبيانات المؤقتة',
    clearCacheSub: 'لا يؤثر على حسابك أو منشوراتك',
    calculate: 'احسب',
    // Explore
    people: 'أشخاص',
    hashtags: 'هاشتاج',
    copyLink: 'نسخ الرابط',
    addStory: 'قصتك',
    storyAdded: 'تم نشر القصة',
  },

  en: {
    // Meta
    tagline: 'Connect Differently · تواصل بشكل مختلف',
    // Auth
    friendRequestSent:     'Friend request sent! 📨',
    friendRequestAccepted: 'Friend request accepted! 🎉',
    requestDeclined:       'Request declined',
    reportSubmitted:       'Report submitted, thanks! 🚩',
    preferencesSaved:      'Preferences saved! ✅',
    fontChanged:           'Font size changed',
    friends:               'Friends',
    welcomeBack: 'Welcome Back',
    createAccount: 'Create New Account',
    username: 'Username',
    password: 'Password',
    fullName: 'Full Name',
    email: 'Email Address',
    rememberMe: 'Remember me',
    forgotPw: 'Forgot password?',
    loginBtn: 'Sign In',
    or: 'or',
    demoLogin: 'Demo Login',
    noAccount: "Don't have an account?",
    signUpNow: 'Sign up now',
    chooseAvatar: 'Profile Photo — Upload or choose emoji',
    agreeTerms: 'I agree to the Terms & Conditions',
    createBtn: 'Create Account',
    haveAccount: 'Already have an account?',
    loginLink: 'Sign in',
    // Nav
    home: 'Home',
    myProfile: 'My Profile',
    explore: 'Explore',
    chat: 'Chat',
    notifications: 'Notifications',
    // Feed
    all: 'All',
    following: 'Following',
    whatsOnMind: "What's on your mind?",
    emoji: 'Emoji',
    photo: 'Photo',
    publish: 'Post',
    // Profile
    posts: 'Posts',
    liked: 'Liked',
    media: 'Media',
    followers: 'Followers',
    editProfile: 'Edit Profile',
    share: 'Share',
    changeCover: 'Change Cover',
    defaultBio: 'Welcome to my profile 🌊',
    // Explore
    searchPh: 'Search people or posts...',
    trendingPosts: 'Trending Now',
    suggestedPeople: 'People You May Know',
    // Chat
    searchConvs: 'Search conversations...',
    noConvs: 'No conversations yet',
    startChat: 'Start a Chat',
    selectConv: 'Select a conversation to start',
    orStartNew: 'Or start a new conversation',
    newMsg: 'New Message',
    typeMsg: 'Type your message...',
    send: 'Send',
    // Notifications
    clearAll: 'Clear All',
    // Right panel
    suggestions: 'Suggested for You',
    trendingNow: 'Trending Now',
    verificationTitle: 'Verification',
    verificationDesc: 'Get the ✓ badge on your account',
    applyVerif: 'Apply for Verification',
    memories: "Today's Memories",
    noMemories: 'No memories yet',
    // Post actions
    like: 'Like',
    comment: 'Comment',
    sharePost: 'Share',
    delete: 'Delete',
    report: 'Report',
    // Toast messages
    postCreated: 'Post published! 🎉',
    postDeleted: 'Post deleted',
    commentAdded: 'Comment added! 💬',
    loginSuccess: 'Welcome back! 👋',
    loggedOut: 'Logged out successfully',
    profileUpdated: 'Profile updated ✅',
    writeFirst: 'Write something first!',
    writeComment: 'Write a comment first',
    fillAll: 'Please fill in all fields',
    pwShort: 'Password must be at least 6 characters',
    userExists: 'Username already exists',
    badCreds: 'Incorrect credentials',
    acceptTerms: 'You must accept the Terms & Conditions',
    msgSent: 'Message sent ✈️',
    writeMsgFirst: 'Write a message first',
    verifApplied: 'Verification request submitted! Review in 3-5 days 🛡️',
    followed: 'Following! 🎉',
    unfollowed: 'Unfollowed',
    copied: 'Copied! 📋',
    reported: 'Post reported 🚩',
    shareComingSoon: 'Profile sharing coming soon! 🔗',
    // Modal titles
    addComment: 'Add a Comment',
    editProfileTitle: 'Edit Profile',
    newChatTitle: 'New Conversation',
    verificationApply: 'Verification Request',
    // Verification modal
    verifModalDesc: 'Verified accounts get the ✓ badge and appear higher in search results.',
    verifRequirements: 'Requirements:',
    verifReq1: '• Account older than 30 days',
    verifReq2: '• Clear profile picture',
    verifReq3: '• Regular activity on the platform',
    submitApplication: 'Submit Application',
    // Edit profile
    nameLabel: 'Name',
    bioLabel: 'Bio',
    bioPlaceholder: 'Tell us about yourself...',
    saveChanges: 'Save Changes',
    // Pw strength
    pwWeak: 'Weak',
    pwFair: 'Fair',
    pwGood: 'Good',
    pwStrong: 'Very Strong ✓',
    // Misc
    justNow: 'Just now',
    minAgo: 'minute',
    minsAgo: 'minutes',
    hourAgo: 'hour',
    hoursAgo: 'hours',
    dayAgo: 'day',
    daysAgo: 'days',
    ago: 'ago',
    online: 'Online now',
    offline: 'Offline',
    typing: 'typing...',
    selectUser: 'Select a user to chat',
    searchUsers: 'Search users...',
    noUsersFound: 'No users found',
    startConversation: 'Start Conversation',
    verified: 'Verified',
    writePost: 'Write your post...',
    submitComment: 'Submit Comment',
    // Nav extras
    market: 'Marketplace',
    videos: 'Videos',
    groups: 'Groups',
    saved: 'Saved',
    settings: 'Settings',
    // Market
    forSale: 'For Sale',
    wanted: 'Wanted',
    marketTitle: 'Product name or offer...',
    marketDesc: 'Describe the item, condition, pickup location...',
    price: 'Price',
    addPhoto: 'Add Photo',
    publishItem: 'Post Item',
    noMarketItems: 'No listings yet — add the first one!',
    contactSeller: 'Contact',
    savedItem: 'Saved 🔖',
    // Videos
    myVideos: 'My Videos',
    videoTitle: 'Video title...',
    videoDesc: 'Video description...',
    uploadVideo: 'Upload Video',
    youtubeLink: 'YouTube Link',
    publishVideo: 'Post',
    noVideos: 'No videos yet',
    addYoutubeLink: 'Add YouTube link',
    // Groups
    createGroup: 'Create Group',
    noGroups: 'No groups yet',
    createGroupHint: 'Create a group and invite your friends',
    groupName: 'Group name...',
    groupDesc: 'Group description...',
    // Saved
    noSaved: 'No saved posts yet',
    savePost: 'Save',
    unsavePost: 'Unsave',
    // Settings
    accountSettings: 'Account Settings',
    editProfileSub: 'Name, photo and bio',
    changePassword: 'Change Password',
    changePasswordSub: 'Keep your account secure',
    privacySettings: 'Privacy & Security',
    privacySettingsSub: 'Who can see your posts and profile',
    appearance: 'Appearance',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    dark: 'Dark',
    light: 'Light',
    accentColor: 'Accent Color',
    accentColorSub: 'Color of buttons and links',
    fontSize: 'Font Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    languageSettings: 'Language',
    language: 'App Language',
    notificationSettings: 'Notification Settings',
    likesNotif: 'Like notifications',
    commentsNotif: 'Comment notifications',
    followersNotif: 'Follower notifications',
    messagesNotif: 'Message notifications',
    about: 'About',
    appVersion: 'App Version',
    termsAndPrivacy: 'Terms & Privacy',
    deleteAccount: 'Delete Account',
    deleteAccountSub: 'This action cannot be undone',
    logout: 'Sign Out',
    settingsSaved: 'Settings saved ✅',
    confirmDeleteAccount: 'Are you sure you want to delete your account? This cannot be undone!',
    passwordChanged: 'Password changed ✅',
    wrongPassword: 'Current password is incorrect',
    pwMismatch: 'Passwords do not match',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    marketItemPosted: 'Item posted! 🛒',
    videoPosted: 'Video posted! 🎬',
    fillMarketFields: 'Enter item name and price',
    fillVideoFields: 'Enter a video title',
    itemSavedToBookmarks: 'Saved to bookmarks 🔖',
    // Profile extras
    aboutTab: 'About',
    profileLocation: 'Location',
    profileWebsite: 'Website',
    profileBirthday: 'Birthday',
    profileJob: 'Job Title',
    profileJoined: 'Joined',
    locationPh: 'e.g. Cairo, Egypt',
    websitePh: 'https://example.com',
    birthdayPh: 'Date of birth',
    jobPh: 'Job title or company',
    coverUploaded: 'Cover updated ✅',
    coverTooLarge: 'Image exceeds 20MB',
    avatarTooLarge: 'Image exceeds 20MB',
    // Settings new keys
    changeUsername: 'Change Username',
    changeEmail: 'Change Email',
    dndMode: 'Do Not Disturb',
    dndSub: 'Mute all notifications temporarily',
    dndOn: 'Do Not Disturb is ON 🔕',
    dndOff: 'Notifications enabled 🔔',
    newUsername: 'New Username',
    newEmail: 'New Email',
    usernameTaken: 'Username already taken',
    usernameInvalid: 'Username: letters, numbers and _ only',
    usernameChanged: 'Username changed ✅',
    emailChanged: 'Email changed ✅',
    emailInvalid: 'Invalid email address',
    confirmWithPassword: 'Enter your password to confirm',
    // Multi-account
    accounts: 'Accounts',
    addAccount: 'Add New Account',
    addAccountSub: 'Sign in with another account',
    switchAccount: 'Switch Account',
    accountsManagement: 'Account Management',
    // Storage
    storageData: 'Storage & Data',
    storageUsed: 'Storage Used',
    clearCache: 'Clear Cache & Temp Data',
    clearCacheSub: 'Does not affect your account or posts',
    calculate: 'Calculate',
    // Explore
    people: 'People',
    hashtags: 'Hashtags',
    copyLink: 'Copy Link',
    addStory: 'Your Story',
    storyAdded: 'Story published',
  }
};

// ── Language Detection ──
// أول مرة: بناخد لغة الجهاز، بعدين نحفظ في localStorage
function detectDeviceLang() {
  const saved = localStorage.getItem('wavex_lang');
  if (saved) return saved;                       // المستخدم اختار قبل كده
  const nav = navigator.language || navigator.userLanguage || 'ar';
  const isArabic = nav.toLowerCase().startsWith('ar');
  return isArabic ? 'ar' : 'en';
}

let currentLang = detectDeviceLang();

function t(key) {
  return LANGS[currentLang]?.[key] || LANGS['ar'][key] || key;
}

function applyI18n() {
  const isAr = currentLang === 'ar';
  document.documentElement.lang = currentLang;
  document.documentElement.dir  = isAr ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('data-lang', currentLang);

  // ── data-i18n text ──
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = LANGS[currentLang]?.[key] || LANGS['ar'][key];
    if (val !== undefined) el.innerHTML = val;
  });

  // ── data-i18n-ph placeholders ──
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = LANGS[currentLang]?.[key] || LANGS['ar'][key];
    if (val !== undefined) el.placeholder = val;
  });

  // ── CFM labels (create menu) ──
  document.querySelectorAll('.cfm-lbl').forEach(el => {
    el.textContent = isAr ? (el.dataset.ar||'') : (el.dataset.en||'');
  });
  const cfmTitle = document.getElementById('cfm-title-txt');
  if (cfmTitle) cfmTitle.textContent = isAr ? 'إنشاء محتوى' : 'Create';
  const cfmClose = document.getElementById('cfm-close-btn');
  if (cfmClose) cfmClose.textContent = isAr ? 'إلغاء' : 'Cancel';

  // ── Mobile bottom nav labels ──
  const mbnLabels = {
    'mbn-feed':    { ar:'الرئيسية', en:'Home'    },
    'mbn-explore': { ar:'بحث',     en:'Search'  },
    'mbn-profile': { ar:'بروفايلي',en:'Profile' },
    'mbn-more':    { ar:'المزيد',  en:'More'    },
  };
  Object.entries(mbnLabels).forEach(([id, labels]) => {
    const el = document.getElementById(id)?.querySelector('.mbn-label');
    if (el) el.textContent = isAr ? labels.ar : labels.en;
  });

  // ── Top header search placeholder ──
  const mthSearch = document.querySelector('.mth-search-placeholder');
  if (mthSearch) mthSearch.textContent = isAr ? 'بحث...' : 'Search...';

  // ── Post creator placeholder ──
  const postTA = document.getElementById('post-content');
  if (postTA) postTA.placeholder = isAr ? 'إيه اللي في بالك؟' : "What's on your mind?";

  // ── Font ──
  document.body.style.fontFamily = isAr
    ? "'Tajawal', 'Cairo', sans-serif"
    : "'DM Sans', 'Syne', sans-serif";

  // ── Lang buttons ──
  document.getElementById('lang-btn-ar')?.classList.toggle('active', isAr);
  document.getElementById('lang-btn-en')?.classList.toggle('active', !isAr);
  const lbl = document.getElementById('current-lang-label');
  if (lbl) lbl.textContent = isAr ? 'العربية' : 'English';

  // ── Settings sections labels ──
  const settLabels = document.getElementById('home-cust-lbl');
  if (settLabels) settLabels.textContent = isAr ? 'تخصيص الهوم' : 'Customize Home';
  const notifLbl = document.getElementById('notif-sett-lbl');
  if (notifLbl) notifLbl.textContent = isAr ? 'إعدادات الإشعارات' : 'Notification Settings';
  const vidLbl = document.getElementById('video-sett-lbl');
  if (vidLbl) vidLbl.textContent = isAr ? 'إعدادات الفيديو' : 'Video Settings';

  // Re-render pages that are currently open to pick up new language
  if (typeof loadSettings === 'function' && document.getElementById('page-settings')?.classList.contains('active')) {
    loadSettings();
  }
}

// setLang — مستخدمة من صفحة الإعدادات
function setLang(lang) {
  if (!LANGS[lang]) return;
  currentLang = lang;
  localStorage.setItem('wavex_lang', lang);
  applyI18n();
  if (typeof showToast === 'function') showToast(t('settingsSaved'));
}

// toggleLang — مستخدمة من زرار FAB السريع
function toggleLang() {
  setLang(currentLang === 'ar' ? 'en' : 'ar');
}

// Apply on load
applyI18n();
