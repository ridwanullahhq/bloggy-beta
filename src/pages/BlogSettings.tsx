import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { Blog } from '../types/blog';
import { BLOG_THEMES } from '../constants/themes';
import sdk from '../lib/sdk-instance';
import { 
  Settings, 
  Palette, 
  Globe, 
  DollarSign, 
  Mail, 
  Shield, 
  Save,
  ArrowLeft
} from 'lucide-react';

const BlogSettings: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: '',
    customDomain: '',
    // Brand colors
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    // Homepage settings
    showFeaturedPosts: true,
    showRecentPosts: true,
    showCategories: true,
    showNewsletter: true,
    showTrending: true,
    heroStyle: 'minimal' as 'minimal' | 'full' | 'banner',
    // Other settings
    allowComments: true,
    moderateComments: false,
    seoOptimized: true,
    monetizationEnabled: false,
    allowFreeContent: true,
    subscriptionPrice: 0,
    payPerArticle: false,
    paywallEnabled: false,
    emailMarketing: false,
    socialAutoPost: false,
    contentScheduling: false
  });

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug || !user) return;

      try {
        const allBlogs = await sdk.get<Blog>('blogs');
        const foundBlog = allBlogs.find(b => b.slug === slug && b.ownerId === user.id);
        
        if (!foundBlog) {
          toast({
            title: "Error",
            description: "Blog not found or you don't have permission to edit it.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setBlog(foundBlog);
        setFormData({
          title: foundBlog.title,
          description: foundBlog.description || '',
          theme: foundBlog.theme,
          customDomain: foundBlog.customDomain || '',
          // Brand colors
          primaryColor: foundBlog.customization?.brandColors?.primary || '',
          secondaryColor: foundBlog.customization?.brandColors?.secondary || '',
          accentColor: foundBlog.customization?.brandColors?.accent || '',
          // Homepage settings
          showFeaturedPosts: foundBlog.customization?.homepageSettings?.showFeaturedPosts !== false,
          showRecentPosts: foundBlog.customization?.homepageSettings?.showRecentPosts !== false,
          showCategories: foundBlog.customization?.homepageSettings?.showCategories !== false,
          showNewsletter: foundBlog.customization?.homepageSettings?.showNewsletter !== false,
          showTrending: foundBlog.customization?.homepageSettings?.showTrending !== false,
          heroStyle: foundBlog.customization?.homepageSettings?.heroStyle || 'minimal',
          // Other settings
          allowComments: foundBlog.settings?.allowComments || true,
          moderateComments: foundBlog.settings?.moderateComments || false,
          seoOptimized: foundBlog.settings?.seoOptimized || true,
          monetizationEnabled: foundBlog.monetization?.enabled || false,
          allowFreeContent: foundBlog.monetization?.allowFreeContent || true,
          subscriptionPrice: foundBlog.monetization?.subscriptionPrice || 0,
          payPerArticle: foundBlog.monetization?.payPerArticle || false,
          paywallEnabled: foundBlog.monetization?.paywallEnabled || false,
          emailMarketing: foundBlog.marketing?.emailMarketing || false,
          socialAutoPost: foundBlog.marketing?.socialAutoPost || false,
          contentScheduling: foundBlog.marketing?.contentScheduling || false
        });
      } catch (error) {
        console.error('Error fetching blog:', error);
        toast({
          title: "Error",
          description: "Failed to load blog settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug, user, navigate, toast]);

  const handleSave = async () => {
    if (!blog) return;

    setSaving(true);
    try {
      const updatedBlog = {
        ...blog,
        title: formData.title,
        description: formData.description,
        theme: formData.theme,
        customDomain: formData.customDomain,
        customization: {
          brandColors: {
            primary: formData.primaryColor,
            secondary: formData.secondaryColor,
            accent: formData.accentColor
          },
          homepageSettings: {
            showFeaturedPosts: formData.showFeaturedPosts,
            showRecentPosts: formData.showRecentPosts,
            showCategories: formData.showCategories,
            showNewsletter: formData.showNewsletter,
            showTrending: formData.showTrending,
            heroStyle: formData.heroStyle
          }
        },
        settings: {
          allowComments: formData.allowComments,
          moderateComments: formData.moderateComments,
          seoOptimized: formData.seoOptimized
        },
        monetization: {
          enabled: formData.monetizationEnabled,
          allowFreeContent: formData.allowFreeContent,
          subscriptionPrice: formData.subscriptionPrice,
          payPerArticle: formData.payPerArticle,
          paywallEnabled: formData.paywallEnabled
        },
        marketing: {
          emailMarketing: formData.emailMarketing,
          socialAutoPost: formData.socialAutoPost,
          contentScheduling: formData.contentScheduling
        },
        updatedAt: new Date().toISOString()
      };

      await sdk.update('blogs', blog.id, updatedBlog);
      setBlog(updatedBlog);
      
      toast({
        title: "Success",
        description: "Blog settings updated successfully.",
      });
    } catch (error) {
      console.error('Error saving blog settings:', error);
      toast({
        title: "Error",
        description: "Failed to save blog settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!blog) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Blog not found</h1>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Settings</h1>
            <p className="text-gray-600 mt-1">{blog.title}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(`/blog/${blog.slug}/manage`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Management
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="domain">Domain</TabsTrigger>
            <TabsTrigger value="monetization">Monetization</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic information about your blog</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Blog Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter blog title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter blog description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowComments">Allow Comments</Label>
                    <p className="text-sm text-gray-500">Let readers comment on your posts</p>
                  </div>
                  <Switch
                    id="allowComments"
                    checked={formData.allowComments}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="moderateComments">Moderate Comments</Label>
                    <p className="text-sm text-gray-500">Approve comments before they appear</p>
                  </div>
                  <Switch
                    id="moderateComments"
                    checked={formData.moderateComments}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, moderateComments: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="seoOptimized">SEO Optimized</Label>
                    <p className="text-sm text-gray-500">Enable SEO features</p>
                  </div>
                  <Switch
                    id="seoOptimized"
                    checked={formData.seoOptimized}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, seoOptimized: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>Customize how your blog looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={formData.theme} onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOG_THEMES.map(theme => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BLOG_THEMES.map(theme => (
                    <div 
                      key={theme.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        formData.theme === theme.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{theme.name}</h3>
                        <div className="flex space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: theme.styles.primaryColor }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: theme.styles.secondaryColor }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: theme.styles.accentColor }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                      
                      {/* Theme Preview */}
                      <div 
                        className="w-full h-24 rounded border mb-2 p-2 text-xs"
                        style={{ 
                          backgroundColor: theme.styles.secondaryColor,
                          fontFamily: theme.styles.fontFamily 
                        }}
                      >
                        <div 
                          className="w-full h-4 rounded mb-1"
                          style={{ backgroundColor: theme.styles.primaryColor }}
                        />
                        <div className="space-y-1">
                          <div 
                            className="w-3/4 h-2 rounded"
                            style={{ backgroundColor: theme.styles.textColor, opacity: 0.7 }}
                          />
                          <div 
                            className="w-1/2 h-2 rounded"
                            style={{ backgroundColor: theme.styles.textColor, opacity: 0.5 }}
                          />
                        </div>
                        <div 
                          className="w-16 h-4 rounded mt-1"
                          style={{ backgroundColor: theme.styles.accentColor }}
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {theme.styles.fontFamily} • {theme.styles.layout}
                      </div>
                      
                      {formData.theme === theme.id && (
                        <div className="mt-2 text-xs text-blue-600 font-medium">
                          ✓ Currently Selected
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Brand Color Customization */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Brand Colors</h3>
                  <p className="text-sm text-gray-600 mb-4">Override theme colors with your brand colors</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#1F2937"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          placeholder="#F8FAFC"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={formData.accentColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={formData.accentColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Homepage Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Homepage Layout</h3>
                  <p className="text-sm text-gray-600 mb-4">Control which sections appear on your blog homepage</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="heroStyle">Hero Style</Label>
                      <Select value={formData.heroStyle} onValueChange={(value: 'minimal' | 'full' | 'banner') => setFormData(prev => ({ ...prev, heroStyle: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="full">Full Hero</SelectItem>
                          <SelectItem value="banner">Banner Style</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showFeaturedPosts">Featured Posts</Label>
                          <p className="text-sm text-gray-500">Show featured posts section</p>
                        </div>
                        <Switch
                          id="showFeaturedPosts"
                          checked={formData.showFeaturedPosts}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showFeaturedPosts: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showRecentPosts">Recent Posts</Label>
                          <p className="text-sm text-gray-500">Show recent posts section</p>
                        </div>
                        <Switch
                          id="showRecentPosts"
                          checked={formData.showRecentPosts}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showRecentPosts: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showCategories">Categories</Label>
                          <p className="text-sm text-gray-500">Show categories section</p>
                        </div>
                        <Switch
                          id="showCategories"
                          checked={formData.showCategories}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showCategories: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showTrending">Trending Posts</Label>
                          <p className="text-sm text-gray-500">Show trending/popular posts</p>
                        </div>
                        <Switch
                          id="showTrending"
                          checked={formData.showTrending}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showTrending: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showNewsletter">Newsletter Signup</Label>
                          <p className="text-sm text-gray-500">Show newsletter subscription form</p>
                        </div>
                        <Switch
                          id="showNewsletter"
                          checked={formData.showNewsletter}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showNewsletter: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Custom Domain
                </CardTitle>
                <CardDescription>Set up your custom domain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input
                    id="customDomain"
                    value={formData.customDomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="example.com"
                  />
                  <p className="text-sm text-gray-500">
                    Enter your custom domain without http:// or https://
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Add a CNAME record pointing to your-blog.lovable.app</li>
                    <li>2. Wait for DNS propagation (can take up to 48 hours)</li>
                    <li>3. SSL certificate will be automatically issued</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monetization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Monetization Settings
                </CardTitle>
                <CardDescription>Configure how you earn from your blog</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="monetizationEnabled">Enable Monetization</Label>
                    <p className="text-sm text-gray-500">Allow paid content and subscriptions</p>
                  </div>
                  <Switch
                    id="monetizationEnabled"
                    checked={formData.monetizationEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, monetizationEnabled: checked }))}
                  />
                </div>
                {formData.monetizationEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allowFreeContent">Allow Free Content</Label>
                        <p className="text-sm text-gray-500">Allow some content to remain free</p>
                      </div>
                      <Switch
                        id="allowFreeContent"
                        checked={formData.allowFreeContent}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowFreeContent: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionPrice">Monthly Subscription Price (₦)</Label>
                      <Input
                        id="subscriptionPrice"
                        type="number"
                        value={formData.subscriptionPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, subscriptionPrice: parseFloat(e.target.value) || 0 }))}
                        placeholder="5000"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="payPerArticle">Pay Per Article</Label>
                        <p className="text-sm text-gray-500">Allow individual article purchases</p>
                      </div>
                      <Switch
                        id="payPerArticle"
                        checked={formData.payPerArticle}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, payPerArticle: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="paywallEnabled">Enable Paywall</Label>
                        <p className="text-sm text-gray-500">Show preview then require payment</p>
                      </div>
                      <Switch
                        id="paywallEnabled"
                        checked={formData.paywallEnabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paywallEnabled: checked }))}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Marketing Settings
                </CardTitle>
                <CardDescription>Manage how you promote your blog</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailMarketing">Email Marketing</Label>
                    <p className="text-sm text-gray-500">Send newsletters to subscribers</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailMarketing"
                      checked={formData.emailMarketing}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailMarketing: checked }))}
                    />
                    {formData.emailMarketing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/blog/${blog.slug}/email-marketing`)}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="socialAutoPost">Social Auto-Post</Label>
                    <p className="text-sm text-gray-500">Automatically share new posts on social media</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="socialAutoPost"
                      checked={formData.socialAutoPost}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, socialAutoPost: checked }))}
                    />
                    {formData.socialAutoPost && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/blog/${blog.slug}/social-media`)}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contentScheduling">Content Scheduling</Label>
                    <p className="text-sm text-gray-500">Schedule posts for future publication</p>
                  </div>
                  <Switch
                    id="contentScheduling"
                    checked={formData.contentScheduling}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contentScheduling: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default BlogSettings;