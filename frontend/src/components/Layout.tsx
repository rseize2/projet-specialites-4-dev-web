import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import { Button } from './ui/button'
import GlobalCallNotifications from './GlobalCallNotifications'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={`
                fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                    <span className="font-semibold text-foreground">WikiCollab</span>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
                        <Outlet />
                    </div>
                </main>
            </div>

            <GlobalCallNotifications />
        </div>
    )
}
