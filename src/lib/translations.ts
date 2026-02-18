// Global UI translations for CampusHub
// Each key maps to a translated string per language code

export interface Translations {
  // Nav
  nav_home: string;
  nav_videos: string;
  nav_resources: string;
  nav_ask_ai: string;
  nav_support: string;
  nav_progress: string;
  nav_downloads: string;
  nav_admin: string;
  nav_sign_in: string;
  nav_sign_out: string;

  // Home
  home_hero_title: string;
  home_hero_desc: string;
  home_start_learning: string;
  home_my_downloads: string;
  home_videos_available: string;
  home_downloaded: string;
  home_completed: string;
  home_quizzes_passed: string;
  home_online: string;
  home_offline: string;
  home_online_desc: string;
  home_offline_desc: string;
  home_download_content: string;
  home_platform_features: string;
  home_offline_videos: string;
  home_offline_videos_desc: string;
  home_learning_resources: string;
  home_learning_resources_desc: string;
  home_track_progress: string;
  home_track_progress_desc: string;
  home_download_manager: string;
  home_download_manager_desc: string;
  home_why_offline: string;
  home_rural: string;
  home_rural_desc: string;
  home_data_costs: string;
  home_data_costs_desc: string;
  home_continuity: string;
  home_continuity_desc: string;
  home_works_offline: string;
  home_less_data: string;
  home_low_end: string;

  // Videos
  videos_title: string;
  videos_subtitle: string;
  videos_search: string;
  videos_all: string;
  videos_all_languages: string;
  videos_low_data: string;
  videos_low_data_desc: string;
  videos_no_results: string;

  // Resources
  resources_title: string;
  resources_subtitle: string;
  resources_search: string;
  resources_type: string;
  resources_subject: string;
  resources_lightweight: string;
  resources_lightweight_desc: string;
  resources_no_results: string;

  // Downloads
  downloads_title: string;
  downloads_subtitle: string;
  downloads_storage_used: string;
  downloads_videos: string;
  downloads_resources: string;
  downloads_offline_ready: string;
  downloads_offline_desc: string;
  downloads_open_offline: string;
  downloads_no_videos: string;
  downloads_no_resources: string;
  downloads_browse_videos: string;
  downloads_browse_resources: string;
  downloads_about: string;
  downloads_about_1: string;
  downloads_about_2: string;
  downloads_about_3: string;
  downloads_about_4: string;
  downloads_syncing: string;
  downloads_pending_sync: string;

  // Progress
  progress_title: string;
  progress_subtitle: string;
  progress_overall: string;
  progress_videos_completed: string;
  progress_resources_completed: string;
  progress_quizzes_passed: string;
  progress_continue: string;
  progress_completed: string;
  progress_no_completed: string;
  progress_no_completed_desc: string;
  progress_start_learning: string;
  progress_quiz_history: string;
  progress_passed: string;
  progress_failed: string;

  // Support
  support_title: string;
  support_subtitle: string;
  support_new_ticket: string;
  support_raise_new: string;
  support_describe: string;
  support_issue_title: string;
  support_category: string;
  support_detail: string;
  support_attach: string;
  support_cancel: string;
  support_submit: string;
  support_no_tickets: string;
  support_sign_in: string;
  support_conversation: string;
  support_no_messages: string;
  support_type_message: string;
  support_back: string;

  // Auth
  auth_title: string;
  auth_desc: string;
  auth_email: string;
  auth_mobile: string;
  auth_sign_in: string;
  auth_sign_up: string;
  auth_email_placeholder: string;
  auth_password_placeholder: string;
  auth_name_placeholder: string;
  auth_create_account: string;
  auth_phone_placeholder: string;
  auth_send_otp: string;
  auth_verify_otp: string;
  auth_change_number: string;
  auth_otp_placeholder: string;

  // Footer
  footer_tagline: string;
  footer_subtitle: string;
}

const en: Translations = {
  nav_home: 'Home', nav_videos: 'Videos', nav_resources: 'Resources', nav_ask_ai: 'Ask AI', nav_support: 'Support', nav_progress: 'My Progress', nav_downloads: 'Downloads', nav_admin: 'Admin', nav_sign_in: 'Sign In', nav_sign_out: 'Sign Out',
  home_hero_title: 'Learn Anytime, Anywhere', home_hero_desc: 'CampusHub brings quality education to rural learners with offline-first videos, resources, and quizzes—designed for low bandwidth and limited devices.', home_start_learning: 'Start Learning', home_my_downloads: 'My Downloads',
  home_videos_available: 'Videos Available', home_downloaded: 'Downloaded', home_completed: 'Completed', home_quizzes_passed: 'Quizzes Passed',
  home_online: 'You are online', home_offline: 'You are offline', home_online_desc: 'Download content now for offline access later', home_offline_desc: 'Your downloaded content is ready to use', home_download_content: 'Download Content',
  home_platform_features: 'Platform Features', home_offline_videos: 'Offline Videos', home_offline_videos_desc: 'Download low-resolution (360p/480p) educational videos for offline viewing', home_learning_resources: 'Learning Resources', home_learning_resources_desc: 'Access PDFs, notes, and audio materials without internet', home_track_progress: 'Track Progress', home_track_progress_desc: 'Monitor your learning journey with quizzes after each lesson', home_download_manager: 'Download Manager', home_download_manager_desc: 'Manage your offline content and storage efficiently',
  home_why_offline: 'Why Offline Learning Matters', home_rural: 'Critical for Rural Areas', home_rural_desc: 'Many rural students face unstable internet connections. Offline videos ensure uninterrupted learning regardless of connectivity.', home_data_costs: 'Reduces Data Costs', home_data_costs_desc: '360p videos use 70% less data than HD streaming. Download once during good connectivity, learn anytime.', home_continuity: 'Learning Continuity', home_continuity_desc: 'Progress syncs automatically when online. Never lose your learning progress, even during network outages.',
  home_works_offline: 'Works completely offline', home_less_data: '70% less data than streaming', home_low_end: 'Optimized for low-end devices',
  videos_title: 'Video Library', videos_subtitle: 'educational videos • Low-resolution for offline use', videos_search: 'Search videos...', videos_all: 'All', videos_all_languages: 'All Languages', videos_low_data: 'Low-Data Mode Active', videos_low_data_desc: 'All videos are 360p/480p resolution for minimal data usage. Download for offline viewing.', videos_no_results: 'No videos found matching your search.',
  resources_title: 'Learning Resources', resources_subtitle: 'resources • PDFs, notes, and audio materials', resources_search: 'Search resources...', resources_type: 'Type:', resources_subject: 'Subject:', resources_lightweight: 'Lightweight Resources', resources_lightweight_desc: 'All resources are optimized for low storage. Download for offline access anytime.', resources_no_results: 'No resources found matching your filters.',
  downloads_title: 'Downloaded Content', downloads_subtitle: 'Manage your offline content and storage', downloads_storage_used: 'Storage Used', downloads_videos: 'Videos', downloads_resources: 'Resources', downloads_offline_ready: 'Offline Content Ready', downloads_offline_desc: 'items available without internet', downloads_open_offline: 'Open Offline Content', downloads_no_videos: 'No videos downloaded', downloads_no_resources: 'No resources downloaded', downloads_browse_videos: 'Browse Videos', downloads_browse_resources: 'Browse Resources', downloads_about: 'About Offline Storage', downloads_about_1: 'Downloaded content is stored in your browser\'s local storage', downloads_about_2: 'Videos and resources remain available even without internet', downloads_about_3: 'Your progress syncs automatically when you\'re back online', downloads_about_4: 'Removing downloads frees up space but doesn\'t delete progress', downloads_syncing: 'Syncing...', downloads_pending_sync: 'pending sync',
  progress_title: 'My Learning Progress', progress_subtitle: 'Track your learning journey and achievements', progress_overall: 'Overall Progress', progress_videos_completed: 'Videos Completed', progress_resources_completed: 'Resources Completed', progress_quizzes_passed: 'Quizzes Passed', progress_continue: 'Continue Learning', progress_completed: 'Completed', progress_no_completed: 'No completed content yet', progress_no_completed_desc: 'Start watching videos or reading resources to track your progress', progress_start_learning: 'Start Learning', progress_quiz_history: 'Quiz History', progress_passed: 'Passed', progress_failed: 'Failed',
  support_title: 'Support', support_subtitle: 'Raise tickets and track your issues', support_new_ticket: 'New Ticket', support_raise_new: 'Raise a New Ticket', support_describe: 'Describe your issue and we\'ll help you out', support_issue_title: 'Issue title', support_category: 'Category', support_detail: 'Describe your issue in detail...', support_attach: 'Attach screenshot/file', support_cancel: 'Cancel', support_submit: 'Submit Ticket', support_no_tickets: 'No tickets yet. Raise one if you need help!', support_sign_in: 'Please sign in to raise support tickets.', support_conversation: 'Conversation', support_no_messages: 'No messages yet', support_type_message: 'Type a message...', support_back: 'Back to tickets',
  auth_title: 'CampusHub', auth_desc: 'Offline-first learning for everyone', auth_email: 'Email', auth_mobile: 'Mobile', auth_sign_in: 'Sign In', auth_sign_up: 'Sign Up', auth_email_placeholder: 'Email address', auth_password_placeholder: 'Password', auth_name_placeholder: 'Full name', auth_create_account: 'Create Account', auth_phone_placeholder: 'Mobile number (e.g., 9876543210)', auth_send_otp: 'Send OTP', auth_verify_otp: 'Verify OTP', auth_change_number: 'Change number', auth_otp_placeholder: 'Enter 6-digit OTP',
  footer_tagline: 'CampusHub - Offline-First Education for Rural Learners', footer_subtitle: 'Low-bandwidth optimized • Works without internet',
};

const hi: Translations = {
  nav_home: 'होम', nav_videos: 'वीडियो', nav_resources: 'संसाधन', nav_ask_ai: 'AI पूछें', nav_support: 'सहायता', nav_progress: 'मेरी प्रगति', nav_downloads: 'डाउनलोड', nav_admin: 'एडमिन', nav_sign_in: 'साइन इन', nav_sign_out: 'साइन आउट',
  home_hero_title: 'कभी भी, कहीं भी सीखें', home_hero_desc: 'CampusHub ग्रामीण शिक्षार्थियों के लिए ऑफ़लाइन वीडियो, संसाधन और क्विज़ लाता है—कम बैंडविड्थ के लिए डिज़ाइन किया गया।', home_start_learning: 'सीखना शुरू करें', home_my_downloads: 'मेरे डाउनलोड',
  home_videos_available: 'उपलब्ध वीडियो', home_downloaded: 'डाउनलोड किए', home_completed: 'पूर्ण', home_quizzes_passed: 'क्विज़ पास',
  home_online: 'आप ऑनलाइन हैं', home_offline: 'आप ऑफ़लाइन हैं', home_online_desc: 'बाद में ऑफ़लाइन उपयोग के लिए अभी कॉन्टेंट डाउनलोड करें', home_offline_desc: 'आपकी डाउनलोड सामग्री उपयोग के लिए तैयार है', home_download_content: 'कॉन्टेंट डाउनलोड करें',
  home_platform_features: 'प्लेटफ़ॉर्म सुविधाएँ', home_offline_videos: 'ऑफ़लाइन वीडियो', home_offline_videos_desc: 'ऑफ़लाइन देखने के लिए कम-रिज़ॉल्यूशन शैक्षिक वीडियो डाउनलोड करें', home_learning_resources: 'शिक्षण संसाधन', home_learning_resources_desc: 'बिना इंटरनेट के PDF, नोट्स और ऑडियो सामग्री एक्सेस करें', home_track_progress: 'प्रगति ट्रैक करें', home_track_progress_desc: 'प्रत्येक पाठ के बाद क्विज़ के साथ अपनी प्रगति पर नज़र रखें', home_download_manager: 'डाउनलोड प्रबंधक', home_download_manager_desc: 'अपनी ऑफ़लाइन सामग्री और स्टोरेज को कुशलतापूर्वक प्रबंधित करें',
  home_why_offline: 'ऑफ़लाइन शिक्षा क्यों महत्वपूर्ण है', home_rural: 'ग्रामीण क्षेत्रों के लिए महत्वपूर्ण', home_rural_desc: 'कई ग्रामीण छात्रों को अस्थिर इंटरनेट का सामना करना पड़ता है। ऑफ़लाइन वीडियो निर्बाध शिक्षा सुनिश्चित करते हैं।', home_data_costs: 'डेटा लागत कम करता है', home_data_costs_desc: '360p वीडियो HD स्ट्रीमिंग से 70% कम डेटा उपयोग करते हैं।', home_continuity: 'शिक्षा की निरंतरता', home_continuity_desc: 'ऑनलाइन होने पर प्रगति स्वचालित रूप से सिंक होती है।',
  home_works_offline: 'पूरी तरह ऑफ़लाइन काम करता है', home_less_data: 'स्ट्रीमिंग से 70% कम डेटा', home_low_end: 'कम-अंत उपकरणों के लिए अनुकूलित',
  videos_title: 'वीडियो लाइब्रेरी', videos_subtitle: 'शैक्षिक वीडियो • ऑफ़लाइन उपयोग के लिए कम-रिज़ॉल्यूशन', videos_search: 'वीडियो खोजें...', videos_all: 'सभी', videos_all_languages: 'सभी भाषाएँ', videos_low_data: 'कम-डेटा मोड सक्रिय', videos_low_data_desc: 'सभी वीडियो न्यूनतम डेटा उपयोग के लिए 360p/480p रिज़ॉल्यूशन में हैं।', videos_no_results: 'आपकी खोज से मेल खाने वाला कोई वीडियो नहीं मिला।',
  resources_title: 'शिक्षण संसाधन', resources_subtitle: 'संसाधन • PDF, नोट्स और ऑडियो सामग्री', resources_search: 'संसाधन खोजें...', resources_type: 'प्रकार:', resources_subject: 'विषय:', resources_lightweight: 'हल्के संसाधन', resources_lightweight_desc: 'सभी संसाधन कम स्टोरेज के लिए अनुकूलित हैं।', resources_no_results: 'आपके फ़िल्टर से मेल खाने वाला कोई संसाधन नहीं मिला।',
  downloads_title: 'डाउनलोड की गई सामग्री', downloads_subtitle: 'अपनी ऑफ़लाइन सामग्री और स्टोरेज प्रबंधित करें', downloads_storage_used: 'उपयोग किया गया स्टोरेज', downloads_videos: 'वीडियो', downloads_resources: 'संसाधन', downloads_offline_ready: 'ऑफ़लाइन सामग्री तैयार', downloads_offline_desc: 'आइटम बिना इंटरनेट के उपलब्ध', downloads_open_offline: 'ऑफ़लाइन सामग्री खोलें', downloads_no_videos: 'कोई वीडियो डाउनलोड नहीं', downloads_no_resources: 'कोई संसाधन डाउनलोड नहीं', downloads_browse_videos: 'वीडियो ब्राउज़ करें', downloads_browse_resources: 'संसाधन ब्राउज़ करें', downloads_about: 'ऑफ़लाइन स्टोरेज के बारे में', downloads_about_1: 'डाउनलोड सामग्री ब्राउज़र के लोकल स्टोरेज में संग्रहीत है', downloads_about_2: 'वीडियो और संसाधन बिना इंटरनेट के भी उपलब्ध रहते हैं', downloads_about_3: 'आपकी प्रगति ऑनलाइन होने पर स्वचालित रूप से सिंक होती है', downloads_about_4: 'डाउनलोड हटाने से स्थान मुक्त होता है लेकिन प्रगति नहीं हटती', downloads_syncing: 'सिंक हो रहा है...', downloads_pending_sync: 'लंबित सिंक',
  progress_title: 'मेरी शिक्षा प्रगति', progress_subtitle: 'अपनी शिक्षा यात्रा और उपलब्धियों को ट्रैक करें', progress_overall: 'समग्र प्रगति', progress_videos_completed: 'वीडियो पूर्ण', progress_resources_completed: 'संसाधन पूर्ण', progress_quizzes_passed: 'क्विज़ पास', progress_continue: 'सीखना जारी रखें', progress_completed: 'पूर्ण', progress_no_completed: 'अभी तक कोई सामग्री पूर्ण नहीं', progress_no_completed_desc: 'प्रगति ट्रैक करने के लिए वीडियो देखना या संसाधन पढ़ना शुरू करें', progress_start_learning: 'सीखना शुरू करें', progress_quiz_history: 'क्विज़ इतिहास', progress_passed: 'पास', progress_failed: 'फ़ेल',
  support_title: 'सहायता', support_subtitle: 'टिकट बनाएँ और अपनी समस्याओं को ट्रैक करें', support_new_ticket: 'नया टिकट', support_raise_new: 'नया टिकट बनाएँ', support_describe: 'अपनी समस्या बताएँ और हम आपकी मदद करेंगे', support_issue_title: 'समस्या शीर्षक', support_category: 'श्रेणी', support_detail: 'अपनी समस्या विस्तार से बताएँ...', support_attach: 'स्क्रीनशॉट/फ़ाइल संलग्न करें', support_cancel: 'रद्द करें', support_submit: 'टिकट जमा करें', support_no_tickets: 'अभी तक कोई टिकट नहीं। मदद चाहिए तो एक बनाएँ!', support_sign_in: 'सहायता टिकट बनाने के लिए कृपया साइन इन करें।', support_conversation: 'बातचीत', support_no_messages: 'अभी तक कोई संदेश नहीं', support_type_message: 'संदेश टाइप करें...', support_back: 'टिकटों पर वापस जाएँ',
  auth_title: 'CampusHub', auth_desc: 'सबके लिए ऑफ़लाइन शिक्षा', auth_email: 'ईमेल', auth_mobile: 'मोबाइल', auth_sign_in: 'साइन इन', auth_sign_up: 'साइन अप', auth_email_placeholder: 'ईमेल पता', auth_password_placeholder: 'पासवर्ड', auth_name_placeholder: 'पूरा नाम', auth_create_account: 'खाता बनाएँ', auth_phone_placeholder: 'मोबाइल नंबर (जैसे 9876543210)', auth_send_otp: 'OTP भेजें', auth_verify_otp: 'OTP सत्यापित करें', auth_change_number: 'नंबर बदलें', auth_otp_placeholder: '6-अंकीय OTP दर्ज करें',
  footer_tagline: 'CampusHub - ग्रामीण शिक्षार्थियों के लिए ऑफ़लाइन शिक्षा', footer_subtitle: 'कम-बैंडविड्थ अनुकूलित • बिना इंटरनेट काम करता है',
};

const ta: Translations = {
  nav_home: 'முகப்பு', nav_videos: 'வீடியோக்கள்', nav_resources: 'வளங்கள்', nav_ask_ai: 'AI கேளுங்கள்', nav_support: 'ஆதரவு', nav_progress: 'எனது முன்னேற்றம்', nav_downloads: 'பதிவிறக்கங்கள்', nav_admin: 'நிர்வாகம்', nav_sign_in: 'உள்நுழை', nav_sign_out: 'வெளியேறு',
  home_hero_title: 'எப்போதும், எங்கும் கற்றுக்கொள்ளுங்கள்', home_hero_desc: 'CampusHub கிராமப்புற மாணவர்களுக்கு ஆஃப்லைன் வீடியோக்கள் மற்றும் வளங்களை வழங்குகிறது.', home_start_learning: 'கற்றலைத் தொடங்கு', home_my_downloads: 'எனது பதிவிறக்கங்கள்',
  home_videos_available: 'கிடைக்கும் வீடியோக்கள்', home_downloaded: 'பதிவிறக்கம்', home_completed: 'நிறைவு', home_quizzes_passed: 'வினாடிவினா தேர்ச்சி',
  home_online: 'நீங்கள் ஆன்லைனில் உள்ளீர்கள்', home_offline: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்', home_online_desc: 'ஆஃப்லைன் அணுகலுக்கு இப்போது உள்ளடக்கத்தைப் பதிவிறக்கவும்', home_offline_desc: 'பதிவிறக்கிய உள்ளடக்கம் பயன்படுத்த தயாராக உள்ளது', home_download_content: 'உள்ளடக்கத்தைப் பதிவிறக்கு',
  home_platform_features: 'இயங்குதள அம்சங்கள்', home_offline_videos: 'ஆஃப்லைன் வீடியோக்கள்', home_offline_videos_desc: 'குறைந்த தரத்தில் கல்வி வீடியோக்களைப் பதிவிறக்கவும்', home_learning_resources: 'கற்றல் வளங்கள்', home_learning_resources_desc: 'இணையம் இல்லாமல் PDF, குறிப்புகள் அணுகவும்', home_track_progress: 'முன்னேற்றம் கண்காணி', home_track_progress_desc: 'ஒவ்வொரு பாடத்திற்குப் பிறகு வினாடிவினாவுடன் முன்னேற்றத்தைக் கண்காணிக்கவும்', home_download_manager: 'பதிவிறக்க மேலாளர்', home_download_manager_desc: 'ஆஃப்லைன் உள்ளடக்கத்தையும் சேமிப்பகத்தையும் நிர்வகிக்கவும்',
  home_why_offline: 'ஆஃப்லைன் கற்றல் ஏன் முக்கியம்', home_rural: 'கிராமப்புறங்களுக்கு முக்கியம்', home_rural_desc: 'பல கிராமப்புற மாணவர்கள் நிலையற்ற இணையத்தை எதிர்கொள்கின்றனர்.', home_data_costs: 'தரவு செலவைக் குறைக்கிறது', home_data_costs_desc: '360p வீடியோக்கள் HD ஸ்ட்ரீமிங்கை விட 70% குறைவான தரவைப் பயன்படுத்துகின்றன.', home_continuity: 'கற்றல் தொடர்ச்சி', home_continuity_desc: 'ஆன்லைனில் இருக்கும்போது முன்னேற்றம் தானாகவே ஒத்திசைக்கப்படும்.',
  home_works_offline: 'முழுமையாக ஆஃப்லைனில் செயல்படும்', home_less_data: 'ஸ்ட்ரீமிங்கை விட 70% குறைவான தரவு', home_low_end: 'குறைந்த சாதனங்களுக்கு உகந்தது',
  videos_title: 'வீடியோ நூலகம்', videos_subtitle: 'கல்வி வீடியோக்கள் • ஆஃப்லைன் பயன்பாட்டிற்கு குறைந்த தரம்', videos_search: 'வீடியோக்களைத் தேடு...', videos_all: 'அனைத்தும்', videos_all_languages: 'அனைத்து மொழிகள்', videos_low_data: 'குறைந்த தரவு முறை செயலில்', videos_low_data_desc: 'அனைத்து வீடியோக்களும் 360p/480p தரத்தில் உள்ளன.', videos_no_results: 'உங்கள் தேடலுக்கு பொருந்தும் வீடியோ இல்லை.',
  resources_title: 'கற்றல் வளங்கள்', resources_subtitle: 'வளங்கள் • PDF, குறிப்புகள் மற்றும் ஆடியோ', resources_search: 'வளங்களைத் தேடு...', resources_type: 'வகை:', resources_subject: 'பாடம்:', resources_lightweight: 'இலகுவான வளங்கள்', resources_lightweight_desc: 'அனைத்து வளங்களும் குறைந்த சேமிப்பகத்திற்கு உகந்தவை.', resources_no_results: 'உங்கள் வடிப்பானுக்கு பொருந்தும் வளம் இல்லை.',
  downloads_title: 'பதிவிறக்கிய உள்ளடக்கம்', downloads_subtitle: 'ஆஃப்லைன் உள்ளடக்கத்தை நிர்வகிக்கவும்', downloads_storage_used: 'சேமிப்பகம் பயன்படுத்தப்பட்டது', downloads_videos: 'வீடியோக்கள்', downloads_resources: 'வளங்கள்', downloads_offline_ready: 'ஆஃப்லைன் உள்ளடக்கம் தயார்', downloads_offline_desc: 'இணையம் இல்லாமல் கிடைக்கும் உருப்படிகள்', downloads_open_offline: 'ஆஃப்லைன் உள்ளடக்கத்தைத் திற', downloads_no_videos: 'வீடியோ பதிவிறக்கம் இல்லை', downloads_no_resources: 'வளம் பதிவிறக்கம் இல்லை', downloads_browse_videos: 'வீடியோக்களை உலாவு', downloads_browse_resources: 'வளங்களை உலாவு', downloads_about: 'ஆஃப்லைன் சேமிப்பகம் பற்றி', downloads_about_1: 'பதிவிறக்கிய உள்ளடக்கம் உலாவியின் லோக்கல் சேமிப்பகத்தில் சேமிக்கப்படுகிறது', downloads_about_2: 'வீடியோக்கள் இணையம் இல்லாமலும் கிடைக்கும்', downloads_about_3: 'ஆன்லைனில் வரும்போது முன்னேற்றம் தானாக ஒத்திசைக்கப்படும்', downloads_about_4: 'பதிவிறக்கங்களை நீக்குவது இடத்தை விடுவிக்கும் ஆனால் முன்னேற்றத்தை நீக்காது', downloads_syncing: 'ஒத்திசைக்கிறது...', downloads_pending_sync: 'நிலுவையில் ஒத்திசைவு',
  progress_title: 'எனது கற்றல் முன்னேற்றம்', progress_subtitle: 'உங்கள் கற்றல் பயணத்தைக் கண்காணிக்கவும்', progress_overall: 'ஒட்டுமொத்த முன்னேற்றம்', progress_videos_completed: 'வீடியோக்கள் நிறைவு', progress_resources_completed: 'வளங்கள் நிறைவு', progress_quizzes_passed: 'வினாடிவினா தேர்ச்சி', progress_continue: 'கற்றலைத் தொடரு', progress_completed: 'நிறைவு', progress_no_completed: 'இன்னும் நிறைவு செய்யப்படவில்லை', progress_no_completed_desc: 'முன்னேற்றத்தைக் கண்காணிக்க வீடியோக்களைப் பாருங்கள்', progress_start_learning: 'கற்றலைத் தொடங்கு', progress_quiz_history: 'வினாடிவினா வரலாறு', progress_passed: 'தேர்ச்சி', progress_failed: 'தோல்வி',
  support_title: 'ஆதரவு', support_subtitle: 'டிக்கெட்டுகளை உருவாக்கி சிக்கல்களைக் கண்காணிக்கவும்', support_new_ticket: 'புதிய டிக்கெட்', support_raise_new: 'புதிய டிக்கெட் உருவாக்கு', support_describe: 'உங்கள் சிக்கலை விவரிக்கவும்', support_issue_title: 'சிக்கல் தலைப்பு', support_category: 'வகை', support_detail: 'சிக்கலை விரிவாக விவரிக்கவும்...', support_attach: 'ஸ்கிரீன்ஷாட்/கோப்பு இணைக்கவும்', support_cancel: 'ரத்து', support_submit: 'டிக்கெட் சமர்ப்பி', support_no_tickets: 'இன்னும் டிக்கெட்டுகள் இல்லை.', support_sign_in: 'ஆதரவு டிக்கெட் உருவாக்க உள்நுழையவும்.', support_conversation: 'உரையாடல்', support_no_messages: 'இன்னும் செய்திகள் இல்லை', support_type_message: 'செய்தியை தட்டச்சு செய்யவும்...', support_back: 'டிக்கெட்டுகளுக்குத் திரும்பு',
  auth_title: 'CampusHub', auth_desc: 'அனைவருக்கும் ஆஃப்லைன் கற்றல்', auth_email: 'மின்னஞ்சல்', auth_mobile: 'மொபைல்', auth_sign_in: 'உள்நுழை', auth_sign_up: 'பதிவு', auth_email_placeholder: 'மின்னஞ்சல் முகவரி', auth_password_placeholder: 'கடவுச்சொல்', auth_name_placeholder: 'முழு பெயர்', auth_create_account: 'கணக்கை உருவாக்கு', auth_phone_placeholder: 'மொபைல் எண்', auth_send_otp: 'OTP அனுப்பு', auth_verify_otp: 'OTP சரிபார்', auth_change_number: 'எண் மாற்று', auth_otp_placeholder: '6-இலக்க OTP',
  footer_tagline: 'CampusHub - கிராமப்புற மாணவர்களுக்கான ஆஃப்லைன் கல்வி', footer_subtitle: 'குறைந்த அலைவரிசை • இணையம் இல்லாமல் செயல்படும்',
};

// For brevity, other languages will fall back to English with key labels overridden
// We provide a factory for remaining languages with just nav + key labels
const createLangTranslations = (overrides: Partial<Translations>): Translations => ({
  ...en,
  ...overrides,
});

const te = createLangTranslations({ nav_home: 'హోమ్', nav_videos: 'వీడియోలు', nav_resources: 'వనరులు', nav_ask_ai: 'AI అడగండి', nav_support: 'సహాయం', nav_progress: 'నా పురోగతి', nav_downloads: 'డౌన్‌లోడ్‌లు', nav_sign_in: 'సైన్ ఇన్', nav_sign_out: 'సైన్ అవుట్', home_hero_title: 'ఎప్పుడైనా, ఎక్కడైనా నేర్చుకోండి', home_start_learning: 'నేర్చుకోవడం ప్రారంభించండి', footer_tagline: 'CampusHub - గ్రామీణ విద్యార్థుల కోసం ఆఫ్‌లైన్ విద్య' });
const kn = createLangTranslations({ nav_home: 'ಮುಖಪುಟ', nav_videos: 'ವೀಡಿಯೊಗಳು', nav_resources: 'ಸಂಪನ್ಮೂಲಗಳು', nav_ask_ai: 'AI ಕೇಳಿ', nav_support: 'ಬೆಂಬಲ', nav_progress: 'ನನ್ನ ಪ್ರಗತಿ', nav_downloads: 'ಡೌನ್‌ಲೋಡ್‌ಗಳು', nav_sign_in: 'ಸೈನ್ ಇನ್', nav_sign_out: 'ಸೈನ್ ಔಟ್', home_hero_title: 'ಯಾವಾಗಲೂ, ಎಲ್ಲಿಯಾದರೂ ಕಲಿಯಿರಿ', home_start_learning: 'ಕಲಿಯಲು ಪ್ರಾರಂಭಿಸಿ', footer_tagline: 'CampusHub - ಗ್ರಾಮೀಣ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಆಫ್‌ಲೈನ್ ಶಿಕ್ಷಣ' });
const mr = createLangTranslations({ nav_home: 'मुख्यपृष्ठ', nav_videos: 'व्हिडिओ', nav_resources: 'संसाधने', nav_ask_ai: 'AI विचारा', nav_support: 'सहाय्य', nav_progress: 'माझी प्रगती', nav_downloads: 'डाउनलोड', nav_sign_in: 'साइन इन', nav_sign_out: 'साइन आउट', home_hero_title: 'कधीही, कुठेही शिका', home_start_learning: 'शिकणे सुरू करा', footer_tagline: 'CampusHub - ग्रामीण विद्यार्थ्यांसाठी ऑफलाइन शिक्षण' });
const bn = createLangTranslations({ nav_home: 'হোম', nav_videos: 'ভিডিও', nav_resources: 'সংস্থান', nav_ask_ai: 'AI জিজ্ঞাসা', nav_support: 'সহায়তা', nav_progress: 'আমার অগ্রগতি', nav_downloads: 'ডাউনলোড', nav_sign_in: 'সাইন ইন', nav_sign_out: 'সাইন আউট', home_hero_title: 'যেকোনো সময়, যেকোনো জায়গায় শিখুন', home_start_learning: 'শেখা শুরু করুন', footer_tagline: 'CampusHub - গ্রামীণ শিক্ষার্থীদের জন্য অফলাইন শিক্ষা' });
const gu = createLangTranslations({ nav_home: 'હોમ', nav_videos: 'વીડિયો', nav_resources: 'સંસાધનો', nav_ask_ai: 'AI પૂછો', nav_support: 'સહાય', nav_progress: 'મારી પ્રગતિ', nav_downloads: 'ડાઉનલોડ', nav_sign_in: 'સાઇન ઇન', nav_sign_out: 'સાઇન આઉટ', home_hero_title: 'ગમે ત્યારે, ગમે ત્યાં શીખો', home_start_learning: 'શીખવાનું શરૂ કરો', footer_tagline: 'CampusHub - ગ્રામીણ વિદ્યાર્થીઓ માટે ઑફલાઇન શિક્ષણ' });
const ml = createLangTranslations({ nav_home: 'ഹോം', nav_videos: 'വീഡിയോകൾ', nav_resources: 'വിഭവങ്ങൾ', nav_ask_ai: 'AI ചോദിക്കൂ', nav_support: 'പിന്തുണ', nav_progress: 'എന്റെ പുരോഗതി', nav_downloads: 'ഡൗൺലോഡുകൾ', nav_sign_in: 'സൈൻ ഇൻ', nav_sign_out: 'സൈൻ ഔട്ട്', home_hero_title: 'എപ്പോഴും, എവിടെയും പഠിക്കൂ', home_start_learning: 'പഠനം ആരംഭിക്കുക', footer_tagline: 'CampusHub - ഗ്രാമീണ വിദ്യാർത്ഥികൾക്കായുള്ള ഓഫ്‌ലൈൻ വിദ്യാഭ്യാസം' });
const pa = createLangTranslations({ nav_home: 'ਹੋਮ', nav_videos: 'ਵੀਡੀਓ', nav_resources: 'ਸਰੋਤ', nav_ask_ai: 'AI ਪੁੱਛੋ', nav_support: 'ਸਹਾਇਤਾ', nav_progress: 'ਮੇਰੀ ਪ੍ਰਗਤੀ', nav_downloads: 'ਡਾਊਨਲੋਡ', nav_sign_in: 'ਸਾਈਨ ਇਨ', nav_sign_out: 'ਸਾਈਨ ਆਊਟ', home_hero_title: 'ਕਦੇ ਵੀ, ਕਿਤੇ ਵੀ ਸਿੱਖੋ', home_start_learning: 'ਸਿੱਖਣਾ ਸ਼ੁਰੂ ਕਰੋ', footer_tagline: 'CampusHub - ਪੇਂਡੂ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਆਫ਼ਲਾਈਨ ਸਿੱਖਿਆ' });

export const ALL_TRANSLATIONS: Record<string, Translations> = { en, hi, ta, te, kn, mr, bn, gu, ml, pa };

export const getTranslations = (lang: string): Translations => {
  return ALL_TRANSLATIONS[lang] || en;
};
