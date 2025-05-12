import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  ArrowRight,
  Filter,
  CalendarDays,
  LineChart,
  PieChart,
  TrendingUp,
  ShoppingCart,
  Mail,
  MessageCircle,
  MessageSquare,
  Zap,
  DollarSign,
  Users,
  CheckCircle2,
  Settings
} from "lucide-react";

import {
  CustomCard,
  CustomCardHeader,
  CustomCardTitle,
  CustomCardDescription,
  CustomCardContent,
  CustomCardFooter,
} from "@/components/ui/custom-card";
import { ConversionMetrics } from "@/components/dashboard/ConversionMetrics";
import { EntityType } from "@prisma/client";

export default function ConversionsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight text-secondary dark:text-white">Conversion Tracking</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <CalendarDays className="mr-2 h-4 w-4 text-secondary" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-secondary/5 dark:bg-secondary/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ConversionMetrics 
            title="Overall Conversion Performance"
            description="Summary of conversions across all channels"
            period="MONTHLY"
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Conversion Rate
                </CustomCardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">8.3%</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowRight className="mr-1 h-3 w-3 text-green-500" />
                  1.2% from last month
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Total Conversions
                </CustomCardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">483</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Revenue
                </CustomCardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">₦5.8M</div>
                <p className="text-xs text-muted-foreground">
                  ₦12,000 avg. per conversion
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Cost Per Conversion
                </CustomCardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">₦1,200</div>
                <p className="text-xs text-muted-foreground">
                  -₦180 from last month
                </p>
              </CustomCardContent>
            </CustomCard>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <CustomCard className="md:col-span-8">
              <CustomCardHeader>
                <CustomCardTitle>Conversion Funnel</CustomCardTitle>
                <CustomCardDescription>
                  Analyze your marketing funnel performance
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="h-[500px] relative">
                  {/* Improved Funnel Visualization with better spacing */}
                  <div className="flex flex-col items-center space-y-8 pt-4">
                    <div className="w-full max-w-lg bg-primary/10 px-4 py-4 rounded-md text-center relative">
                      <div className="font-medium">Visitors</div>
                      <div className="text-2xl font-bold">12,450</div>
                      <div className="text-sm text-muted-foreground">100%</div>
                    </div>
                    
                    <div className="relative w-full flex justify-center">
                      <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[20px] border-primary/10"></div>
                    </div>

                    <div className="w-full max-w-[85%] bg-primary/20 px-4 py-4 rounded-md text-center">
                      <div className="font-medium">Leads</div>
                      <div className="text-2xl font-bold">5,280</div>
                      <div className="text-sm text-muted-foreground">42.4%</div>
                    </div>
                    
                    <div className="relative w-full flex justify-center">
                      <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[20px] border-primary/20"></div>
                    </div>

                    <div className="w-full max-w-[70%] bg-primary/30 px-4 py-4 rounded-md text-center">
                      <div className="font-medium">Opportunities</div>
                      <div className="text-2xl font-bold">1,860</div>
                      <div className="text-sm text-muted-foreground">14.9%</div>
                    </div>
                    
                    <div className="relative w-full flex justify-center">
                      <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[20px] border-primary/30"></div>
                    </div>

                    <div className="w-full max-w-[55%] bg-primary/40 px-4 py-4 rounded-md text-center">
                      <div className="font-medium">Conversions</div>
                      <div className="text-2xl font-bold">483</div>
                      <div className="text-sm text-muted-foreground">3.9%</div>
                    </div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>

            <CustomCard className="md:col-span-4">
              <CustomCardHeader>
                <CustomCardTitle>Channel Breakdown</CustomCardTitle>
                <CustomCardDescription>
                  Conversion by marketing channel
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <div className="text-sm font-medium">152 (31%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '31%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 text-accent mr-2" />
                        <span className="text-sm font-medium">SMS</span>
                      </div>
                      <div className="text-sm font-medium">125 (26%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-accent" style={{ width: '26%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 text-secondary mr-2" />
                        <span className="text-sm font-medium">WhatsApp</span>
                      </div>
                      <div className="text-sm font-medium">96 (20%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-secondary" style={{ width: '20%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium">Automations</span>
                      </div>
                      <div className="text-sm font-medium">110 (23%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <CustomCard className="md:col-span-6">
              <CustomCardHeader>
                <CustomCardTitle>Nigerian Market Segments</CustomCardTitle>
                <CustomCardDescription>
                  Conversion rates by key market segments
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="font-medium">Segment</div>
                    <div className="font-medium">Conversion Rate</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Lagos Metropolitan</span>
                    </div>
                    <div className="text-sm font-medium">12.4%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Abuja & FCT</span>
                    </div>
                    <div className="text-sm font-medium">10.8%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Port Harcourt</span>
                    </div>
                    <div className="text-sm font-medium">9.1%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Ibadan & SW Cities</span>
                    </div>
                    <div className="text-sm font-medium">8.2%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Kano & Northern Markets</span>
                    </div>
                    <div className="text-sm font-medium">6.5%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Eastern Markets</span>
                    </div>
                    <div className="text-sm font-medium">7.3%</div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>

            <CustomCard className="md:col-span-6">
              <CustomCardHeader>
                <CustomCardTitle>Top Performing Products</CustomCardTitle>
                <CustomCardDescription>
                  Products with highest conversion rates
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="font-medium">Product</div>
                    <div className="font-medium">Conversions</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Premium Banking Solutions</span>
                    </div>
                    <div className="text-sm font-medium">87</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Telecom Service Bundles</span>
                    </div>
                    <div className="text-sm font-medium">65</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">E-commerce Solutions</span>
                    </div>
                    <div className="text-sm font-medium">52</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Educational Course Package</span>
                    </div>
                    <div className="text-sm font-medium">48</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Real Estate Consultation</span>
                    </div>
                    <div className="text-sm font-medium">42</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Healthcare Services</span>
                    </div>
                    <div className="text-sm font-medium">39</div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ConversionMetrics 
              entityType={EntityType.EMAIL_CAMPAIGN}
              title="Email Campaign Conversions"
              description="Track email campaign conversion performance"
              period="WEEKLY"
            />
            
            <ConversionMetrics 
              entityType={EntityType.SMS_CAMPAIGN}
              title="SMS Campaign Conversions"
              description="Track SMS campaign conversion performance"
              period="WEEKLY"
            />
            
            <ConversionMetrics 
              entityType={EntityType.WHATSAPP_CAMPAIGN}
              title="WhatsApp Campaign Conversions"
              description="Track WhatsApp campaign conversion performance"
              period="WEEKLY"
            />
            
            <ConversionMetrics 
              entityType={EntityType.WORKFLOW}
              title="Workflow Conversions"
              description="Track workflow automation conversion performance"
              period="WEEKLY"
            />
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ConversionMetrics 
              entityType={EntityType.EMAIL_CAMPAIGN}
              title="Email Campaigns"
              description="Email campaign conversion attribution"
              period="MONTHLY"
            />
            
            <ConversionMetrics 
              entityType={EntityType.SMS_CAMPAIGN}
              title="SMS Campaigns"
              description="SMS campaign conversion attribution"
              period="MONTHLY"
            />
            
            <ConversionMetrics 
              entityType={EntityType.WHATSAPP_CAMPAIGN}
              title="WhatsApp Campaigns"
              description="WhatsApp campaign conversion attribution"
              period="MONTHLY"
            />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <ConversionMetrics 
              title="Conversion Goals"
              description="Track progress against your conversion goals"
              period="YEARLY"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
