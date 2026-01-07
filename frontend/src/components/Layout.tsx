import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    Box,
    Flex,
    IconButton,
    useDisclosure,
    VStack,
    HStack,
    Text,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Tooltip,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerOverlay,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Lucide from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

const {
    Menu: MenuIcon,
    X,
    LayoutDashboard,
    CheckSquare,
    LogOut,
    User,
    Settings,
    Bell,
    Bot,
} = Lucide;

const MotionBox = motion(Box);

interface LayoutProps {
    children: ReactNode;
    userRole: 'Student' | 'Teacher' | 'Admin';
    isFullScreen?: boolean;
}


const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => {
    return (
        <Tooltip label={collapsed ? label : ''} placement="right" hasArrow bg="gray.700" color="white">
            <HStack
                as="button"
                onClick={onClick}
                w="full"
                py={3}
                px={collapsed ? 2 : 4}
                justify={collapsed ? 'center' : 'flex-start'}
                borderRadius="xl"
                transition="all 0.2s"
                bg={active ? 'blue.500' : 'transparent'}
                color={active ? 'white' : 'gray.400'}
                _hover={{ bg: active ? 'blue.600' : 'whiteAlpha.100', color: active ? 'white' : 'gray.200', transform: 'translateX(2px)' }}
            >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {!collapsed && (
                    <Text fontWeight={active ? '600' : '500'} fontSize="md">
                        {label}
                    </Text>
                )}
                {active && !collapsed && (
                    <Box ml="auto" w="6px" h="6px" borderRadius="full" bg="white" />
                )}
            </HStack>
        </Tooltip>
    );
};

const Layout: React.FC<LayoutProps> = ({ children, userRole, isFullScreen = false }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = React.useState(false);

    // Avatar & User State
    // Initialize with a fallback to avoid empty state (which causes 'P' initial)
    const [avatarUrl, setAvatarUrl] = useState(() => {
        return localStorage.getItem('userAvatarUrl') || '';
    });
    const [displayName, setDisplayName] = useState(() => localStorage.getItem('fullName') || '');
    const [displayRole, setDisplayRole] = useState(userRole);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Basic User Info (Name)
                const userRes = await api.get('/auth/users/me/');
                if (userRes.data) {
                    const fullName = `${userRes.data.first_name || ''} ${userRes.data.last_name || ''}`.trim() || userRes.data.username;
                    const role = userRes.data.role || userRole;
                    setDisplayName(fullName);
                    setDisplayRole(role);
                    localStorage.setItem('fullName', fullName);

                    // Default immediately to username seed to prevent 'P' fallback
                    let style = 'avataaars';
                    let seed = userRes.data.username;
                    const fallbackUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

                    // Set fallback immediately if we have nothing or empty string
                    if (!avatarUrl) {
                        setAvatarUrl(fallbackUrl);
                    }

                    // 2. Fetch Gamification for latest Avatar
                    try {
                        const xpRes = await api.get('/gamification/me/');
                        if (xpRes.data) {
                            style = xpRes.data.avatar_style || 'avataaars';
                            seed = xpRes.data.avatar_seed || seed;

                            const newUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

                            // Only update if changed to prevent flicker
                            if (newUrl !== avatarUrl) {
                                setAvatarUrl(newUrl);
                                localStorage.setItem('userAvatarUrl', newUrl);
                            }
                        }
                    } catch (err) {
                        // API failure or gamification disabled: Force the fallback URL
                        // This ensures we at least have *some* image based on username
                        if (!avatarUrl || avatarUrl === '') {
                            setAvatarUrl(fallbackUrl);
                            localStorage.setItem('userAvatarUrl', fallbackUrl);
                        }
                    }
                }
            } catch (error) {
                console.error("Layout fetch error", error);
                const fallbackName = localStorage.getItem('fullName') || 'User';
                setDisplayName(fallbackName);

                // Absolute last resort fallback
                if (!avatarUrl) {
                    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackName}`);
                }
            }
        };

        fetchData();

        // Listener for updates from Settings page
        window.addEventListener('profileUpdated', fetchData);
        return () => window.removeEventListener('profileUpdated', fetchData);
    }, [userRole]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: userRole === 'Teacher' ? '/teacher-dashboard' : '/student-dashboard' },
        { icon: CheckSquare, label: 'Projects', path: userRole === 'Teacher' ? '/teacher/approved-projects' : '/student/my-projects' },
        { icon: Bot, label: 'AI Mentor', path: '/ai-chat' },
    ];

    const SidebarContent = ({ isMobile = false }) => (
        <Flex flexDir="column" h="full">
            {/* Logo Area */}
            <Flex align="center" justify={(!isMobile && collapsed) ? 'center' : 'space-between'} mb={8} px={2}>
                {(!collapsed || isMobile) && (
                    <HStack spacing={3}>
                        <Box p={2} bgGradient="linear(to-br, blue.500, purple.600)" borderRadius="lg">
                            <LayoutDashboard color="white" size={20} />
                        </Box>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="lg" fontWeight="800" letterSpacing="tight" lineHeight="1" color="white">
                                PMS<Text as="span" color="blue.400">.AI</Text>
                            </Text>
                            <Text fontSize="xs" color="gray.400" fontWeight="500">Workspace</Text>
                        </VStack>
                    </HStack>
                )}
                {!isMobile && collapsed && (
                    <Box p={2} bgGradient="linear(to-br, blue.500, purple.600)" borderRadius="lg">
                        <LayoutDashboard color="white" size={20} />
                    </Box>
                )}
                {!isMobile && (
                    <IconButton
                        aria-label="Toggle Sidebar"
                        icon={collapsed ? <MenuIcon size={18} /> : <X size={18} />}
                        size="xs"
                        variant="ghost"
                        onClick={() => setCollapsed(!collapsed)}
                        display={collapsed ? 'none' : 'flex'}
                        color="gray.400"
                        _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                    />
                )}
                {isMobile && (
                    <IconButton
                        aria-label="Close Sidebar"
                        icon={<X size={18} />}
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        color="gray.400"
                    />
                )}
            </Flex>

            {/* Navigation Items */}
            <VStack spacing={2} align="stretch" flex={1}>
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        path={item.path}
                        active={location.pathname === item.path}
                        onClick={() => {
                            navigate(item.path);
                            if (isMobile) onClose();
                        }}
                        collapsed={!isMobile && collapsed}
                    />
                ))}
            </VStack>

            {/* User Profile & Logout */}
            <Box pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                <Menu placement="right-end">
                    <MenuButton w="full">
                        <HStack justify={(!isMobile && collapsed) ? 'center' : 'flex-start'} spacing={3} p={2} borderRadius="xl" _hover={{ bg: 'whiteAlpha.100' }}>
                            <Avatar size="sm" name={displayName} src={avatarUrl} bgGradient="linear(to-r, blue.400, purple.500)" />
                            {(!collapsed || isMobile) && (
                                <VStack align="start" spacing={0} overflow="hidden">
                                    <Text fontSize="sm" fontWeight="600" color="gray.200" isTruncated>
                                        {displayName}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">{displayRole}</Text>
                                </VStack>
                            )}
                        </HStack>
                    </MenuButton>
                    <MenuList className="glass-card" border="1px solid rgba(255,255,255,0.1)" boxShadow="xl" bg="#1e293b" zIndex={2000}>
                        <MenuItem icon={<User size={16} />} bg="transparent" _hover={{ bg: 'whiteAlpha.100' }} onClick={() => navigate('/student/profile')}>Profile</MenuItem>
                        <MenuItem icon={<Settings size={16} />} bg="transparent" _hover={{ bg: 'whiteAlpha.100' }} onClick={() => navigate('/settings')}>Settings</MenuItem>
                        <MenuDivider borderColor="whiteAlpha.200" />
                        <MenuItem icon={<LogOut size={16} />} color="red.400" bg="transparent" _hover={{ bg: 'whiteAlpha.100' }} onClick={handleLogout}>
                            Logout
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Box>
        </Flex>
    );

    const paddingX = isFullScreen ? 0 : { base: 4, md: 8 };
    const paddingBottom = isFullScreen ? 0 : 8;

    return (
        <Flex minH="100vh" position="relative" direction="row">
            {/* Animated Background Mesh */}
            <Box className="animated-bg" position="absolute" top={0} left={0} w="full" h="full" zIndex={-1} pointerEvents="none" />

            {/* --- Desktop Sidebar (Sticky) --- */}
            <MotionBox
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                display={{ base: 'none', md: 'flex' }}
                flexDir="column"
                w={collapsed ? '80px' : '260px'}
                h="calc(100vh - 32px)"
                m={4}
                p={4}
                className="glass-card"
                position="sticky"
                top={4}
                zIndex={10}
                bg="rgba(15, 23, 42, 0.6)"
                border="1px solid rgba(255, 255, 255, 0.08)"
            >
                <SidebarContent />
            </MotionBox>

            {/* --- Mobile Sidebar (Drawer) --- */}
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                <DrawerOverlay backdropFilter="blur(5px)" />
                <DrawerContent bg="gray.900" borderRight="1px solid rgba(255,255,255,0.1)">
                    <DrawerBody p={4}>
                        <SidebarContent isMobile={true} />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* --- Main Content Area --- */}
            <Flex direction="column" flex={1} position="relative" w="full" minW="0" zIndex={1}>
                {/* Top Navbar (Mobile Only / Search Bar) */}
                <Flex
                    px={paddingX}
                    py={4}
                    justify="space-between"
                    align="center"
                    position="sticky"
                    top={0}
                    zIndex={5}
                    bg="transparent"
                >
                    <Box display={{ base: 'block', md: 'none' }}>
                        <IconButton icon={<MenuIcon />} aria-label="Menu" onClick={onOpen} variant="ghost" color="white" />
                    </Box>


                    <HStack spacing={4} ml="auto">
                        <IconButton
                            aria-label="Notifications"
                            icon={<Bell size={20} />}
                            variant="ghost"
                            borderRadius="full"
                            color="gray.400"
                            _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                        />
                        <Avatar
                            size="sm"
                            name={displayName}
                            src={avatarUrl}
                            cursor="pointer"
                            onClick={() => navigate('/settings')}
                            bgGradient="linear(to-r, blue.400, purple.500)"
                        />
                    </HStack>
                </Flex>

                {/* Page Content with Transition */}
                <Flex
                    flex="1"
                    direction="column"
                    px={paddingX}
                    pb={paddingBottom}
                    position="relative"
                    overflowY={isFullScreen ? 'hidden' : 'auto'}
                    h={isFullScreen ? '100%' : 'auto'}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default Layout;
