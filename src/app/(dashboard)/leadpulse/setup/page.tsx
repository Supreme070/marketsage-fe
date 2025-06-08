'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Check, RefreshCw, Code, Globe, SmartphoneNfc, Smartphone } from 'lucide-react';

export default function LeadPulseSetupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tracking');
  const [pixelId, setPixelId] = useState('lp_2g3h4j2k3h4kj23h4'); // Would be fetched from API
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [mobileCopied, setMobileCopied] = useState('');
  const [selectedMobilePlatform, setSelectedMobilePlatform] = useState('react-native');
  const [appId, setAppId] = useState('your-app-id');
  const [qrCode, setQrCode] = useState({
    name: 'WhatsApp Lead Form',
    number: '+2348012345678',
    message: 'Hello, I would like to learn more about your services.',
  });
  
  // Generate WhatsApp QR code URL
  const whatsappUrl = `https://wa.me/${qrCode.number.replace(/\D/g, '')}${qrCode.message ? `?text=${encodeURIComponent(qrCode.message)}` : ''}`;
  
  // Get tracking code
  const trackingCode = `
<!-- LeadPulse Tracking Code -->
<script>
(function(w, d, p) {
  // Don't initialize twice
  if (w.LeadPulse) return;
  
  // Configuration
  const pixelId = '${pixelId}';
  const endpoint = 'https://marketsage.africa/api/leadpulse/track';
  
  // Main LeadPulse object
  const lp = w.LeadPulse = {};
  let visitorId = null;
  let fingerprint = null;
  let sessionStartTime = Date.now();
  
  // Initialize storage
  function initStorage() {
    try {
      lp.storage = localStorage;
      // Test storage
      lp.storage.setItem('LP_TEST', '1');
      lp.storage.removeItem('LP_TEST');
    } catch (e) {
      // Fallback to cookie-based storage if localStorage is unavailable
      lp.storage = {
        getItem: function(key) {
          const matches = d.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
          return matches ? decodeURIComponent(matches[1]) : null;
        },
        setItem: function(key, value) {
          d.cookie = key + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax';
        }
      };
    }
    
    // Try to get existing visitor ID
    visitorId = lp.storage.getItem('LP_VID');
    fingerprint = lp.storage.getItem('LP_FP');
  }
  
  // Initialize visitor tracking
  function initVisitor() {
    // Initialize and send ping
    fetch(endpoint + '/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId,
        fingerprint: fingerprint || '',
        existingId: visitorId || null,
        userAgent: navigator.userAgent,
        referrer: d.referrer,
        url: w.location.href
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.visitorId) {
        visitorId = data.visitorId;
        lp.storage.setItem('LP_VID', visitorId);
      }
    })
    .catch(() => {});
  }
  
  // Initialize tracking
  initStorage();
  initVisitor();
})(window, document);
</script>
<!-- End LeadPulse Tracking Code -->
`.trim();

  // Generate mobile tracking codes for different platforms
  const getMobileTrackingCode = (platform: string) => {
    const baseConfig = {
      apiEndpoint: 'https://marketsage.africa',
      appId: appId,
      pixelId: pixelId,
      debug: false
    };

    switch (platform) {
      case 'react-native':
        return `// React Native Integration
// 1. Install dependencies
npm install react-native-device-info @react-native-async-storage/async-storage

// 2. Add to your App.js or main component
import { LeadPulseReactNative } from './lib/leadpulse-mobile-sdk';

const tracker = new LeadPulseReactNative({
  apiEndpoint: '${baseConfig.apiEndpoint}',
  appId: '${baseConfig.appId}',
  debug: __DEV__
});

// 3. Initialize in your App component
useEffect(() => {
  const initializeTracking = async () => {
    try {
      await tracker.initializeWithDeviceInfo();
      console.log('LeadPulse tracking initialized');
    } catch (error) {
      console.error('Failed to initialize tracking:', error);
    }
  };
  
  initializeTracking();
}, []);

// 4. Track screen views
const trackScreen = (screenName) => {
  tracker.trackScreenView(screenName);
};

// 5. Track interactions
const trackInteraction = (buttonId, data = {}) => {
  tracker.trackInteraction(buttonId, data);
};

// 6. Track conversions
const trackConversion = (type, value, data = {}) => {
  tracker.trackConversion(type, value, data);
};

// Example usage:
// trackScreen('HomeScreen');
// trackInteraction('login_button', { source: 'homepage' });
// trackConversion('purchase', 1000, { product: 'premium_plan' });`;

      case 'ios-swift':
        return `// iOS Swift Integration
// 1. Add to your ViewController or App Delegate

import Foundation

class LeadPulseTracker {
    private let apiEndpoint = "${baseConfig.apiEndpoint}"
    private let appId = "${baseConfig.appId}"
    private var deviceId: String = ""
    private var visitorId: String?
    
    init() {
        self.deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        initialize()
    }
    
    private func initialize() {
        let deviceData: [String: Any] = [
            "deviceId": deviceId,
            "appId": appId,
            "platform": "ios",
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0",
            "deviceModel": UIDevice.current.model,
            "osVersion": UIDevice.current.systemVersion,
            "locale": Locale.current.identifier,
            "timezone": TimeZone.current.identifier
        ]
        
        let url = URL(string: "\\(apiEndpoint)/api/leadpulse/mobile/identify")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: [
                "deviceId": deviceId,
                "deviceData": deviceData
            ])
            request.httpBody = jsonData
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let visitorId = json["visitorId"] as? String {
                    self.visitorId = visitorId
                    UserDefaults.standard.set(visitorId, forKey: "leadpulse_visitor_id")
                    self.trackEvent("app_open", properties: [:])
                }
            }.resume()
        } catch {
            print("LeadPulse initialization failed: \\(error)")
        }
    }
    
    func trackScreen(_ screenName: String, properties: [String: Any] = [:]) {
        trackEvent("screen_view", properties: ["screenName": screenName] + properties)
    }
    
    func trackInteraction(_ elementId: String, properties: [String: Any] = [:]) {
        trackEvent("button_tap", properties: ["elementId": elementId] + properties)
    }
    
    func trackConversion(_ type: String, value: Double? = nil, properties: [String: Any] = [:]) {
        var props = properties
        props["conversionType"] = type
        if let value = value { props["value"] = value }
        trackEvent("conversion", properties: props)
    }
    
    private func trackEvent(_ eventType: String, properties: [String: Any]) {
        guard let visitorId = visitorId else { return }
        
        let eventData: [String: Any] = [
            "visitorId": visitorId,
            "deviceId": deviceId,
            "appId": appId,
            "eventType": eventType,
            "properties": properties,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        
        let url = URL(string: "\\(apiEndpoint)/api/leadpulse/mobile/track")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: eventData)
            URLSession.shared.dataTask(with: request).resume()
        } catch {
            print("Failed to track event: \\(error)")
        }
    }
}

// Usage:
let tracker = LeadPulseTracker()
tracker.trackScreen("HomeViewController")
tracker.trackInteraction("login_button", properties: ["source": "home"])
tracker.trackConversion("purchase", value: 99.99, properties: ["product": "premium"])`;

      case 'android-kotlin':
        return `// Android Kotlin Integration
// 1. Add to your MainActivity or Application class

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.*
import java.util.concurrent.TimeUnit

class LeadPulseTracker(private val context: Context) {
    private val apiEndpoint = "${baseConfig.apiEndpoint}"
    private val appId = "${baseConfig.appId}"
    private val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
    private var visitorId: String? = null
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .build()
    
    init {
        initialize()
    }
    
    private fun initialize() {
        val deviceData = JSONObject().apply {
            put("deviceId", deviceId)
            put("appId", appId)
            put("platform", "android")
            put("appVersion", getAppVersion())
            put("deviceModel", Build.MODEL)
            put("osVersion", Build.VERSION.RELEASE)
            put("locale", Locale.getDefault().toString())
            put("timezone", TimeZone.getDefault().id)
        }
        
        val requestBody = JSONObject().apply {
            put("deviceId", deviceId)
            put("deviceData", deviceData)
        }
        
        val request = Request.Builder()
            .url("\$apiEndpoint/api/leadpulse/mobile/identify")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                response.body?.string()?.let { responseBody ->
                    val json = JSONObject(responseBody)
                    visitorId = json.optString("visitorId")
                    context.getSharedPreferences("leadpulse", Context.MODE_PRIVATE)
                        .edit()
                        .putString("visitor_id", visitorId)
                        .apply()
                    trackEvent("app_open", JSONObject())
                }
            }
            
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
            }
        })
    }
    
    fun trackScreen(screenName: String, properties: JSONObject = JSONObject()) {
        properties.put("screenName", screenName)
        trackEvent("screen_view", properties)
    }
    
    fun trackInteraction(elementId: String, properties: JSONObject = JSONObject()) {
        properties.put("elementId", elementId)
        trackEvent("button_tap", properties)
    }
    
    fun trackConversion(type: String, value: Double? = null, properties: JSONObject = JSONObject()) {
        properties.put("conversionType", type)
        value?.let { properties.put("value", it) }
        trackEvent("conversion", properties)
    }
    
    private fun trackEvent(eventType: String, properties: JSONObject) {
        val visitorId = this.visitorId ?: return
        
        val eventData = JSONObject().apply {
            put("visitorId", visitorId)
            put("deviceId", deviceId)
            put("appId", appId)
            put("eventType", eventType)
            put("properties", properties)
            put("timestamp", Date().toInstant().toString())
        }
        
        val request = Request.Builder()
            .url("\$apiEndpoint/api/leadpulse/mobile/track")
            .post(eventData.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                // Event tracked successfully
            }
            
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
            }
        })
    }
    
    private fun getAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName
        } catch (e: Exception) {
            "1.0.0"
        }
    }
}

// Usage:
val tracker = LeadPulseTracker(this)
tracker.trackScreen("MainActivity")
tracker.trackInteraction("login_button", JSONObject().put("source", "home"))
tracker.trackConversion("purchase", 99.99, JSONObject().put("product", "premium"))`;

      case 'flutter':
        return `// Flutter Integration
// 1. Add to pubspec.yaml dependencies:
// device_info_plus: ^9.1.0
// shared_preferences: ^2.2.0
// http: ^1.1.0

// 2. Create leadpulse_tracker.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:device_info_plus/device_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LeadPulseTracker {
  static const String _apiEndpoint = '${baseConfig.apiEndpoint}';
  static const String _appId = '${baseConfig.appId}';
  
  String? _deviceId;
  String? _visitorId;
  
  Future<void> initialize() async {
    final deviceInfo = DeviceInfoPlugin();
    
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      _deviceId = androidInfo.id;
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      _deviceId = iosInfo.identifierForVendor;
    }
    
    final prefs = await SharedPreferences.getInstance();
    _visitorId = prefs.getString('leadpulse_visitor_id');
    
    final deviceData = {
      'deviceId': _deviceId,
      'appId': _appId,
      'platform': Platform.isAndroid ? 'android' : 'ios',
      'appVersion': '1.0.0', // Get from package_info_plus
      'locale': Platform.localeName,
    };
    
    try {
      final response = await http.post(
        Uri.parse('\$_apiEndpoint/api/leadpulse/mobile/identify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'deviceId': _deviceId,
          'deviceData': deviceData,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _visitorId = data['visitorId'];
        await prefs.setString('leadpulse_visitor_id', _visitorId!);
        await trackEvent('app_open', {});
      }
    } catch (e) {
      print('LeadPulse initialization failed: \$e');
    }
  }
  
  Future<void> trackScreen(String screenName, [Map<String, dynamic>? properties]) async {
    final props = properties ?? {};
    props['screenName'] = screenName;
    await trackEvent('screen_view', props);
  }
  
  Future<void> trackInteraction(String elementId, [Map<String, dynamic>? properties]) async {
    final props = properties ?? {};
    props['elementId'] = elementId;
    await trackEvent('button_tap', props);
  }
  
  Future<void> trackConversion(String type, {double? value, Map<String, dynamic>? properties}) async {
    final props = properties ?? {};
    props['conversionType'] = type;
    if (value != null) props['value'] = value;
    await trackEvent('conversion', props);
  }
  
  Future<void> trackEvent(String eventType, Map<String, dynamic> properties) async {
    if (_visitorId == null) return;
    
    final eventData = {
      'visitorId': _visitorId,
      'deviceId': _deviceId,
      'appId': _appId,
      'eventType': eventType,
      'properties': properties,
      'timestamp': DateTime.now().toIso8601String(),
    };
    
    try {
      await http.post(
        Uri.parse('\$_apiEndpoint/api/leadpulse/mobile/track'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(eventData),
      );
    } catch (e) {
      print('Failed to track event: \$e');
    }
  }
}

// Usage:
final tracker = LeadPulseTracker();
await tracker.initialize();
tracker.trackScreen('HomePage');
tracker.trackInteraction('login_button', {'source': 'home'});
tracker.trackConversion('purchase', value: 99.99, properties: {'product': 'premium'});`;

      default:
        return 'Select a platform to see the integration code.';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMobileCode = (platform: string, text: string) => {
    navigator.clipboard.writeText(text);
    setMobileCopied(platform);
    setTimeout(() => setMobileCopied(''), 2000);
  };
  
  // Save website settings
  const saveSettings = () => {
    alert('Settings saved successfully!');
  };
  
  // Generate new pixel ID
  const generateNewPixelId = () => {
    const newId = 'lp_' + Math.random().toString(36).substring(2, 15);
    setPixelId(newId);
  };
  
  // Save QR code settings
  const saveQrCode = () => {
    alert('WhatsApp QR code settings saved!');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/leadpulse')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">LeadPulse Setup</h1>
        </div>
        <Button onClick={saveSettings}>Save Changes</Button>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking">
            <Code className="h-4 w-4 mr-2" />
            Web Tracking
          </TabsTrigger>
          <TabsTrigger value="mobile">
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile Apps
          </TabsTrigger>
          <TabsTrigger value="website">
            <Globe className="h-4 w-4 mr-2" />
            Website Settings
          </TabsTrigger>
          <TabsTrigger value="qrcode">
            <SmartphoneNfc className="h-4 w-4 mr-2" />
            WhatsApp QR Code
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your LeadPulse Tracking Code</CardTitle>
              <CardDescription>
                Add this code to your website to start tracking visitor behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Your Pixel ID</Label>
                  <div className="flex items-center mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {pixelId}
                    </code>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={generateNewPixelId}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New ID
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tracking Code</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(trackingCode)}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Textarea 
                    value={trackingCode}
                    readOnly
                    className="font-mono text-xs h-80 overflow-auto"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Implementation Instructions</Label>
                <div className="text-sm space-y-4 border rounded-md p-4">
                  <p>
                    To start tracking visitor behavior on your website, add the tracking code above to every page of your website, immediately before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag.
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Copy the code above</li>
                    <li>Open your website's HTML template or header section</li>
                    <li>Paste the code before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag</li>
                    <li>Save your changes and deploy your website</li>
                    <li>Return to MarketSage to verify the installation</li>
                  </ol>
                  <p>
                    Once installed, LeadPulse will begin tracking visitor behavior, engagement, and interactions automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Installation Status</CardTitle>
              <CardDescription>
                Check if your tracking code is properly installed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Badge className="bg-yellow-500">Pending</Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  We haven't detected the tracking code on your website yet. Please install the code and check again.
                </span>
              </div>
              <Button className="mt-4" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Installation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile App Tracking Integration</CardTitle>
              <CardDescription>
                Get tracking code for your mobile apps (React Native, iOS, Android, Flutter)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>App ID</Label>
                  <div className="flex items-center mt-1">
                    <Input 
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="your-app-id"
                      className="w-64"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique identifier for your mobile app
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Select Platform</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['react-native', 'ios-swift', 'android-kotlin', 'flutter'].map((platform) => (
                    <Button
                      key={platform}
                      variant={selectedMobilePlatform === platform ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMobilePlatform(platform)}
                      className="justify-start"
                    >
                      {platform === 'react-native' && '⚛️ React Native'}
                      {platform === 'ios-swift' && '🍎 iOS Swift'}
                      {platform === 'android-kotlin' && '🤖 Android Kotlin'}
                      {platform === 'flutter' && '🐦 Flutter'}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    {selectedMobilePlatform === 'react-native' && 'React Native Integration Code'}
                    {selectedMobilePlatform === 'ios-swift' && 'iOS Swift Integration Code'}
                    {selectedMobilePlatform === 'android-kotlin' && 'Android Kotlin Integration Code'}
                    {selectedMobilePlatform === 'flutter' && 'Flutter Integration Code'}
                  </Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyMobileCode(selectedMobilePlatform, getMobileTrackingCode(selectedMobilePlatform))}
                  >
                    {mobileCopied === selectedMobilePlatform ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Textarea 
                    value={getMobileTrackingCode(selectedMobilePlatform)}
                    readOnly
                    className="font-mono text-xs h-96 overflow-auto"
                  />
                </div>
              </div>
              
                              <div className="space-y-4">
                <Label>Mobile Tracking Setup Options</Label>
                
                {/* Tracking Mode Selection */}
                <div className="border rounded-md p-4 space-y-3">
                  <h4 className="text-sm font-medium text-center">Choose Your Tracking Approach</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3 space-y-2 bg-green-50 dark:bg-green-950/30">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">🤖</span>
                        <h5 className="text-sm font-medium text-green-900 dark:text-green-100">Automatic Tracking</h5>
                        <Badge variant="outline" className="text-green-700 border-green-300">Recommended</Badge>
                      </div>
                      <div className="text-xs text-green-800 dark:text-green-200 space-y-1">
                        <p><strong>Setup:</strong> Initialize ONCE in your app</p>
                        <p><strong>Tracking:</strong> Everything happens automatically</p>
                        <p><strong>Screens:</strong> Auto-detects all screen views</p>
                        <p><strong>Interactions:</strong> Auto-tracks all button taps</p>
                        <p><strong>Heatmaps:</strong> Touch coordinate tracking</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3 space-y-2 bg-blue-50 dark:bg-blue-950/30">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">⚙️</span>
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">Manual Tracking</h5>
                        <Badge variant="outline" className="text-blue-700 border-blue-300">Advanced</Badge>
                      </div>
                      <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <p><strong>Setup:</strong> Add tracking to each screen</p>
                        <p><strong>Tracking:</strong> Full control over what's tracked</p>
                        <p><strong>Screens:</strong> Manual trackScreenView() calls</p>
                        <p><strong>Interactions:</strong> Selective button tracking</p>
                        <p><strong>Heatmaps:</strong> Custom touch event tracking</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Feature Comparison */}
                <div className="space-y-2">
                  <Label>Feature Comparison</Label>
                  <div className="border rounded-md p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Feature</th>
                            <th className="text-center py-2 px-2">🌐 Web Tracking</th>
                            <th className="text-center py-2 px-2">🤖 Auto Mobile</th>
                            <th className="text-center py-2 px-2">⚙️ Manual Mobile</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b">
                            <td className="py-2 px-2">Setup Complexity</td>
                            <td className="text-center py-2 px-2">✅ One-time paste</td>
                            <td className="text-center py-2 px-2">✅ One-time init</td>
                            <td className="text-center py-2 px-2">⚠️ Per-screen setup</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-2">Screen/Page Views</td>
                            <td className="text-center py-2 px-2">✅ Automatic</td>
                            <td className="text-center py-2 px-2">✅ Automatic</td>
                            <td className="text-center py-2 px-2">❌ Manual calls</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-2">Click/Tap Tracking</td>
                            <td className="text-center py-2 px-2">✅ All elements</td>
                            <td className="text-center py-2 px-2">✅ All buttons</td>
                            <td className="text-center py-2 px-2">⚙️ Selective</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-2">Heatmaps</td>
                            <td className="text-center py-2 px-2">✅ Mouse tracking</td>
                            <td className="text-center py-2 px-2">✅ Touch tracking</td>
                            <td className="text-center py-2 px-2">⚙️ Custom events</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-2">Form Tracking</td>
                            <td className="text-center py-2 px-2">✅ All forms</td>
                            <td className="text-center py-2 px-2">✅ All inputs</td>
                            <td className="text-center py-2 px-2">⚙️ Tagged forms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2">Performance Impact</td>
                            <td className="text-center py-2 px-2">⚡ Minimal</td>
                            <td className="text-center py-2 px-2">⚡ Optimized</td>
                            <td className="text-center py-2 px-2">🚀 Minimal</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Tracking Features */}
                <div className="space-y-2">
                  <Label>Mobile Tracking Capabilities</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3 space-y-2">
                      <h4 className="text-sm font-medium">📱 App Analytics</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Screen view tracking (automatic/manual)</li>
                        <li>• Button tap analytics with coordinates</li>
                        <li>• App session tracking & duration</li>
                        <li>• User engagement scoring</li>
                        <li>• Touch heatmaps & interaction zones</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-md p-3 space-y-2">
                      <h4 className="text-sm font-medium">🔗 Cross-Platform</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Unified web + mobile dashboard</li>
                        <li>• Cross-device user journeys</li>
                        <li>• Real-time synchronization</li>
                        <li>• Consistent visitor IDs</li>
                        <li>• Platform-specific insights</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-md p-3 space-y-2">
                      <h4 className="text-sm font-medium">💰 E-commerce</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• In-app purchase tracking</li>
                        <li>• Conversion attribution</li>
                        <li>• Revenue analytics</li>
                        <li>• Funnel optimization</li>
                        <li>• Cart abandonment recovery</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-md p-3 space-y-2">
                      <h4 className="text-sm font-medium">🔔 Push Notifications</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Push token management</li>
                        <li>• Notification engagement</li>
                        <li>• Segmented campaigns</li>
                        <li>• Behavior-triggered messaging</li>
                        <li>• Deep link attribution</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🚀 GTBank Mobile Banking Example
                </h4>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <p><strong>Screen Tracking:</strong> Track user flow from login → balance check → transfer</p>
                  <p><strong>Conversion Events:</strong> Money transfers, bill payments, investment purchases</p>
                  <p><strong>Engagement:</strong> Time spent in different banking sections</p>
                  <p><strong>Security:</strong> Secure device fingerprinting and session management</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="website" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Website Configuration</CardTitle>
              <CardDescription>
                Configure LeadPulse for your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input 
                  id="website-url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the URL of the website where LeadPulse will be installed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Tracking Options</Label>
                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-clicks" defaultChecked />
                      <Label htmlFor="track-clicks" className="text-sm font-normal">Track Click Events</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-forms" defaultChecked />
                      <Label htmlFor="track-forms" className="text-sm font-normal">Track Form Interactions</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-scroll" defaultChecked />
                      <Label htmlFor="track-scroll" className="text-sm font-normal">Track Scroll Depth</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-exit" defaultChecked />
                      <Label htmlFor="track-exit" className="text-sm font-normal">Track Exit Intent</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Privacy Settings</Label>
                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="respect-dnt" defaultChecked />
                      <Label htmlFor="respect-dnt" className="text-sm font-normal">Respect Do Not Track</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="anonymize-ip" defaultChecked />
                      <Label htmlFor="anonymize-ip" className="text-sm font-normal">Anonymize IP Addresses</Label>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    These settings help ensure compliance with privacy regulations such as NDPR
                  </p>
                </div>
              </div>
              
              <Button onClick={saveSettings}>Save Website Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="qrcode" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp QR Code Generator</CardTitle>
              <CardDescription>
                Create QR codes for offline-to-online lead capture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="qr-name">QR Code Name</Label>
                <Input 
                  id="qr-name"
                  value={qrCode.name}
                  onChange={(e) => setQrCode({...qrCode, name: e.target.value})}
                  placeholder="e.g. Contact Form"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                <Input 
                  id="whatsapp-number"
                  value={qrCode.number}
                  onChange={(e) => setQrCode({...qrCode, number: e.target.value})}
                  placeholder="+2348012345678"
                />
                <p className="text-sm text-muted-foreground">
                  Include country code (e.g. +234 for Nigeria)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp-message">Pre-filled Message (Optional)</Label>
                <Textarea 
                  id="whatsapp-message"
                  value={qrCode.message}
                  onChange={(e) => setQrCode({...qrCode, message: e.target.value})}
                  placeholder="Hello, I would like to learn more about your services."
                  rows={3}
                />
              </div>
              
              <div className="bg-muted rounded-md p-6 flex flex-col items-center justify-center">
                <div className="mb-4 w-48 h-48 bg-white flex items-center justify-center rounded-md border-2">
                  {/* This would be a real QR code in production */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">QR Code Preview</p>
                    <p className="text-xs">WhatsApp Link:</p>
                    <p className="text-xs font-mono truncate max-w-32">{whatsappUrl}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(whatsappUrl)}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">Download QR</Button>
                </div>
              </div>
              
              <Button onClick={saveQrCode}>Save QR Code</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your QR Codes</CardTitle>
              <CardDescription>
                Manage your existing WhatsApp QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  No QR codes have been created yet.
                </p>
                <p className="text-muted-foreground text-sm">
                  Create your first QR code using the form above.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 