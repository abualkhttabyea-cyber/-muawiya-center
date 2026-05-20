
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Wallet, 
  Archive, 
  LogOut, 
  GraduationCap,
  Settings,
  UserCheck,
  Award,
  Loader2,
  Download,
  LayoutTemplate
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface DashboardShellProps {
  children: React.ReactNode;
  userRole?: string;
}

export function DashboardShell({ children, userRole: propRole }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userProfileRef = useMemo(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);
  
  const currentRole = profile?.role || propRole || 'TEACHER';

  const settingsRef = useMemo(() => db ? doc(db, 'settings', 'center') : null, [db]);
  const { data: remoteSettings, loading: settingsLoading } = useDoc(settingsRef);

  const logoData = PlaceHolderImages.find(img => img.id === 'center-logo');
  const centerName = remoteSettings?.name || 'مركز معاويه لتحفيظ القران الكريم وعلومه';
  const centerLogo = remoteSettings?.logoUrl || logoData?.imageUrl;

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push('/');
  };

  const adminRoles = ['ADMIN', 'MANAGER', 'DEPUTY_MANAGER', 'SUPERVISOR'];

  const menuItems = [
    { title: 'نظرة عامة', icon: LayoutDashboard, href: '/dashboard', roles: [...adminRoles, 'TEACHER'] },
    { title: 'إدارة الحلقات', icon: GraduationCap, href: '/dashboard/halaqat', roles: [...adminRoles, 'TEACHER'] },
    { title: 'شؤون المعلمين', icon: UserCheck, href: '/dashboard/teachers', roles: adminRoles },
    { title: 'شؤون الطلاب', icon: Users, href: '/dashboard/students', roles: [...adminRoles, 'TEACHER'] },
    { title: 'اعتماد الطلبات', icon: ShieldCheck, href: '/dashboard/approvals', roles: adminRoles },
    { title: 'إدارة الترقيات', icon: Award, href: '/dashboard/promotions', roles: ['ADMIN'] },
    { title: 'الإدارة المالية', icon: Wallet, href: '/dashboard/finance', roles: adminRoles },
    { title: 'الأرشيف العام', icon: Archive, href: '/dashboard/archive', roles: [...adminRoles, 'TEACHER'] },
    { title: 'إعدادات المركز', icon: Settings, href: '/dashboard/settings', roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentRole));

  const handleInstallClick = () => {
    toast({
      title: "تثبيت كـ APK",
      description: "من خيارات المتصفح (النقاط الثلاث)، اختر 'إضافة إلى الشاشة الرئيسية' ليظهر التطبيق كأيقونة APK على جوالك.",
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary size-10" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground font-body relative">
        {!settingsLoading && centerLogo && (
          <div className="watermark-bg opacity-5" style={{ backgroundImage: `url(${centerLogo})` }} />
        )}
        
        <Sidebar side="right" className="border-l border-border bg-card/50 backdrop-blur-xl">
          <SidebarHeader className="p-6 border-b border-border/50">
            <Link href="/dashboard" className="flex items-center gap-4 group">
              <div className="w-12 h-12 flex items-center justify-center relative">
                <Image src={centerLogo || "https://picsum.photos/seed/muawiya-logo/192/192"} alt="Logo" width={48} height={48} className="object-contain h-full w-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-primary text-[10px] leading-tight max-w-[150px]">{centerName}</span>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="p-4 space-y-1">
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} className={cn("flex items-center gap-3 px-4 py-7 rounded-2xl transition-all", pathname === item.href ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/10 text-muted-foreground hover:text-primary")}>
                    <Link href={item.href}>
                      <item.icon className="size-5 shrink-0" />
                      <span className="font-bold text-base">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleInstallClick} className="flex items-center gap-3 px-4 py-7 rounded-2xl transition-all text-green-500 hover:bg-green-500/10">
                  <Download className="size-5 shrink-0" />
                  <span className="font-bold text-base">تثبيت كـ APK</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border/50">
            <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-3 px-4 py-4 rounded-xl text-destructive hover:bg-destructive/10">
              <LogOut className="size-5" />
              <span className="font-bold">تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 z-10 relative text-right">
          <header className="h-20 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-8">
            <SidebarTrigger className="text-primary size-10 hover:bg-primary/10 rounded-xl" />
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-left">
                <p className="text-sm font-black text-foreground" dir="ltr">{user?.email}</p>
                <p className="text-[10px] text-green-500 font-bold">متصل بالسحابة</p>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/20 flex items-center justify-center bg-muted/20">
                <Image src={centerLogo || "https://picsum.photos/seed/muawiya-logo/192/192"} alt="Logo" width={40} height={40} className="w-full h-full object-contain p-1" />
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full fade-slide-in">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
