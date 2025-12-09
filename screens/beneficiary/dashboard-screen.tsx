import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    type ImageStyle,
    type ImageResizeMode,
    type ViewStyle,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useT } from 'lingo.dev/react';

import { AppButton } from '@/components/atoms/app-button';
import { AppIcon, type IconName } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { InfoCard } from '@/components/molecules/info-card';
import { LanguageSwitcher } from '@/components/molecules/language-switcher';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTheme } from '@/hooks/use-theme';
import type { BeneficiaryDrawerParamList } from '@/navigation/types';
import { governmentUpdatesClient, type GovernmentUpdate } from '@/services/ai/governmentUpdates';
import { useAuthStore } from '@/state/authStore';
import type { AppTheme } from '@/constants/theme';

type BeneficiaryNavigation = DrawerNavigationProp<BeneficiaryDrawerParamList>;
type CalculatorRoute = 'EmiCalculator' | 'SubsidyCalculator' | 'EligibilityPrediction';

type MenuItemKey = 'trackLoan' | 'uploadEvidence' | 'geoCamera' | 'notifications' | 'contactOfficer' | 'myProfile';

const menuItems: Array<{ key: MenuItemKey; title: string; icon: IconName; color: string; background: string }> = [
    { key: 'trackLoan', title: 'Track Loan', icon: 'clipboard-text-clock-outline', color: '#1D4ED8', background: '#E8F2FF' },
    { key: 'uploadEvidence', title: 'Upload Evidence', icon: 'cloud-upload-outline', color: '#7C3AED', background: '#F3E8FF' },
    { key: 'geoCamera', title: 'Geo-Camera', icon: 'camera-marker-outline', color: '#0F766E', background: '#E6FFFA' },
    { key: 'notifications', title: 'Notifications', icon: 'bell-outline', color: '#D97706', background: '#FFF8E1' },
    { key: 'contactOfficer', title: 'Contact Officer', icon: 'card-account-phone-outline', color: '#059669', background: '#E8F9EE' },
    { key: 'myProfile', title: 'My Profile', icon: 'account-circle-outline', color: '#BE185D', background: '#FFE8F2' },
];

const trainingItems = [
    { title: 'Job programs', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80' },
    { title: 'Learning videos', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80' },
    { title: 'Government skill centres', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
];

const calculatorItems: Array<{
    title: string;
    desc: string;
    image: string;
    route: CalculatorRoute;
    imageStyle?: ImageStyle;
    imageResizeMode?: ImageResizeMode;
    imageContainerStyle?: ViewStyle;
    imageAspectRatio?: number;
}> = [
    {
        title: 'EMI calculator',
        desc: 'Plan your repayment.',
        image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80',
        route: 'EmiCalculator',
        imageResizeMode: 'cover',
        imageAspectRatio: 1.8,
    },
    {
        title: 'Subsidy calculator',
        desc: 'Check your benefits.',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        route: 'SubsidyCalculator',
        imageResizeMode: 'cover',
        imageAspectRatio: 1.8,
    },
    {
        title: 'Eligibility prediction',
        desc: 'Know your chances.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        route: 'EligibilityPrediction',
        imageResizeMode: 'cover',
        imageAspectRatio: 1.8,
    },
];

const grievanceItems: Array<{
    title: string;
    desc: string;
    image: string;
    imageResizeMode?: ImageResizeMode;
    imageContainerStyle?: ViewStyle;
    imageAspectRatio?: number;
}> = [
    {
        title: 'Submit issue',
        desc: 'Face any problem? Let us know.',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Track complaint',
        desc: 'Check status of your tickets.',
        image: 'https://images.unsplash.com/photo-1478479474071-8a3014d422c8?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Officer response',
        desc: 'View replies from officials.',
        image: 'https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=800&q=80',
    },
];

const BeneficiaryDashboardScreen = () => {
    const navigation = useNavigation<BeneficiaryNavigation>();
    const { mode, toggleTheme } = useTheme();
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const profile = useAuthStore((state) => state.profile);
    const t = useT();

    const defaultGovUpdates: GovernmentUpdate[] = [
        {
            title: 'MSME Digi-SIP launches AI monitoring',
            description: 'DIN laterals connect NIDHI SETU dashboards with state facilitation cells to fast-track FY25 claims.',
            imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
        },
        {
            title: 'Green credit window for rural clusters',
            description: 'SIDBI adds 4% interest subsidy for solar-powered looms under the 2025 MSME decarbonisation package.',
            imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        },
    ];

    const [governmentUpdates, setGovernmentUpdates] = useState<GovernmentUpdate[]>(defaultGovUpdates);
    const [updatesLoading, setUpdatesLoading] = useState(false);
    const [updatesError, setUpdatesError] = useState<string | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const [selectedUpdate, setSelectedUpdate] = useState<GovernmentUpdate | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const locationWatcher = useRef<Location.LocationSubscription | null>(null);

    const mapRegion = useMemo(
        () =>
            userLocation
                ? {
                      ...userLocation,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                  }
                : {
                      latitude: 20.5937,
                      longitude: 78.9629,
                      latitudeDelta: 10,
                      longitudeDelta: 10,
                  },
        [userLocation]
    );

    const iconColor = theme.colors.icon;
    const iconBackground = theme.colors.surfaceVariant;

    const cardWidth = useMemo(() => {
        const width = Dimensions.get('window').width;
        return Math.max(220, Math.min(320, width - 80));
    }, []);

    const fetchGovernmentUpdates = useCallback(async (focusTopic?: string) => {
        setUpdatesLoading(true);
        setUpdatesError(null);
        try {
            const updates = await governmentUpdatesClient.fetchLatest(focusTopic);
            setGovernmentUpdates(updates);
            setLastUpdatedAt(new Date().toISOString());
        } catch (error) {
            console.error('Government updates fetch error:', error);
            setUpdatesError(t('Unable to refresh live policy feed. Showing cached briefs.'));
        } finally {
            setUpdatesLoading(false);
        }
    }, [t]);

    const fetchCurrentLocation = useCallback(async () => {
        setLocationLoading(true);
        setLocationError(null);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError(t('Location permission is required to show the live map.'));
                return;
            }

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        } catch (error) {
            console.error('Location fetch error:', error);
            setLocationError(t('Unable to fetch current location. Please try again.'));
        } finally {
            setLocationLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchGovernmentUpdates();
    }, [fetchGovernmentUpdates]);

    useEffect(() => {
        let isActive = true;

        const startWatching = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocationError(t('Location permission is required to show the live map.'));
                    return;
                }

                const subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 4000,
                        distanceInterval: 5,
                    },
                    (position) => {
                        if (!isActive) return;
                        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                    }
                );

                if (!isActive) {
                    subscription.remove();
                    return;
                }

                locationWatcher.current = subscription;
            } catch (error) {
                console.error('Location watcher error:', error);
                setLocationError('Unable to track location in real time.');
            }
        };

        if (mapModalVisible) {
            fetchCurrentLocation();
            startWatching();
        } else if (locationWatcher.current) {
            locationWatcher.current.remove();
            locationWatcher.current = null;
        }

        return () => {
            isActive = false;
            if (locationWatcher.current) {
                locationWatcher.current.remove();
                locationWatcher.current = null;
            }
        };
    }, [mapModalVisible, fetchCurrentLocation, t]);

    const lastUpdatedLabel = useMemo(() => {
        if (!lastUpdatedAt) return null;
        const date = new Date(lastUpdatedAt);
        return `${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • ${date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        })}`;
    }, [lastUpdatedAt]);

    const formatPublishedAt = useCallback(
        (value?: string) => {
            if (!value) return t('Live policy brief');
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return value;
            }
            return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
        },
        [t]
    );

    const openUpdateDetail = (item: GovernmentUpdate) => {
        setSelectedUpdate(item);
        setIsModalVisible(true);
        fetchGovernmentUpdates(item.title);
    };

    const closeModal = () => {
        setIsModalVisible(false);
    };

    const handleMenuPress = (key: MenuItemKey) => {
        switch (key) {
            case 'trackLoan':
                navigation.navigate('PreviousSubmissions' as never);
                break;
            case 'uploadEvidence':
                navigation.navigate('UploadEvidence' as never);
                break;
            case 'geoCamera':
                setMapModalVisible(true);
                break;
            case 'notifications':
                navigation.navigate('Notifications' as never);
                break;
            case 'contactOfficer':
                navigation.navigate('ContactOfficer' as never);
                break;
            case 'myProfile':
                navigation.navigate('BeneficiaryProfile' as never);
                break;
            default:
                console.warn('Unknown menu item:', key);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                    <AppIcon name="menu" size={28} color={theme.colors.icon} />
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    <Image
                        source={{ uri: profile?.avatarUrl || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                        style={styles.avatar}
                    />
                    <View style={styles.userDetails}>
                        <AppText style={styles.userName} numberOfLines={1}>
                            {profile?.name ?? 'Gokul Kumari'}
                        </AppText>
                        <AppText style={styles.greeting} numberOfLines={1}>
                            {t('Good morning')}
                        </AppText>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={[styles.iconButton, { backgroundColor: iconBackground }]}
                        accessibilityLabel="Toggle dark mode"
                    >
                        <AppIcon name={mode === 'light' ? 'weather-night' : 'white-balance-sunny'} size={22} color={iconColor} />
                    </TouchableOpacity>
                    <LanguageSwitcher variant="inline" iconColor={iconColor} />
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications' as never)}
                        style={[styles.iconButton, { backgroundColor: iconBackground }]}
                        accessibilityLabel="Notifications"
                    >
                        <AppIcon name="bell-outline" size={24} color={iconColor} />
                        <View style={styles.badge} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.card, { backgroundColor: item.background }]}
                            onPress={() => handleMenuPress(item.key)}
                        >
                            <View style={styles.iconContainer}>
                                <AppIcon name={item.icon} size={36} color={item.color} />
                            </View>
                            <AppText style={styles.cardTitle}>{t(item.title)}</AppText>
                            <AppText style={styles.viewStatus}>{t('View Status')}</AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText style={styles.sectionTitle}>{t('Government Updates')}</AppText>
                        <TouchableOpacity onPress={() => fetchGovernmentUpdates()} disabled={updatesLoading} style={styles.refreshButton}>
                            <AppIcon
                                name="refresh"
                                size={18}
                                color={updatesLoading ? theme.colors.subtext : theme.colors.primary}
                            />
                            <AppText style={[styles.refreshText, updatesLoading && styles.refreshDisabled]}>
                                {updatesLoading ? t('Refreshing...') : t('Refresh')}
                            </AppText>
                        </TouchableOpacity>
                    </View>
                    {lastUpdatedLabel && (
                        <AppText style={styles.statusText}>
                            {t('Updated')} {lastUpdatedLabel}
                        </AppText>
                    )}
                    {updatesError && <AppText style={styles.errorText}>{t(updatesError)}</AppText>}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {governmentUpdates.map((item, index) => (
                            <View key={`${item.title}-${index}`} style={[styles.horizontalCardWrapper, { width: cardWidth }]}>
                                <InfoCard
                                    title={t(item.title)}
                                    description={t(item.description)}
                                    image={item.imageUrl}
                                    variant="standard"
                                    onPress={() => openUpdateDetail(item)}
                                />
                            </View>
                        ))}
                        {updatesLoading && (
                            <View style={[styles.horizontalCardWrapper, styles.loadingCard]}>
                                <ActivityIndicator color={theme.colors.primary} />
                            </View>
                        )}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>{t('Training & Skill Development')}</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {trainingItems.map((item, index) => (
                            <View key={index} style={styles.horizontalCardWrapper}>
                                <InfoCard title={t(item.title)} image={item.image} variant="overlay" />
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>{t('Financial Calculator')}</AppText>
                    <View style={styles.verticalList}>
                        {calculatorItems.map((item, index) => (
                            <InfoCard
                                key={index}
                                title={t(item.title)}
                                description={t(item.desc)}
                                image={item.image}
                                variant="standard"
                                style={{ marginBottom: 16 }}
                                onPress={() => navigation.navigate(item.route)}
                                imageStyle={item.imageStyle}
                                imageResizeMode={item.imageResizeMode}
                                imageContainerStyle={item.imageContainerStyle}
                                imageAspectRatio={item.imageAspectRatio}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>{t('Complaint / Grievance Redressal')}</AppText>
                    <View style={styles.verticalList}>
                        {grievanceItems.map((item, index) => (
                            <InfoCard
                                key={index}
                                title={t(item.title)}
                                description={t(item.desc)}
                                image={item.image}
                                variant="standard"
                                style={{ marginBottom: 16 }}
                                imageResizeMode={item.imageResizeMode}
                                imageContainerStyle={item.imageContainerStyle}
                                imageAspectRatio={item.imageAspectRatio}
                            />
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal visible={mapModalVisible} transparent animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.mapModalContent}>
                        <View style={styles.mapModalHeader}>
                            <AppText style={styles.mapModalTitle}>{t('Live Map View')}</AppText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <LanguageSwitcher variant="inline" iconColor={theme.colors.icon} />
                                <TouchableOpacity onPress={() => setMapModalVisible(false)}>
                                    <AppIcon name="close" size={22} color={theme.colors.icon} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.mapContainerModal}>
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                region={mapRegion}
                                showsUserLocation
                                showsCompass
                                loadingEnabled
                            >
                                {userLocation ? <Marker coordinate={userLocation} /> : null}
                            </MapView>

                            <View style={styles.mapStatusRow}>
                                {locationLoading ? (
                                    <View style={styles.statusChip}>
                                        <ActivityIndicator color={theme.colors.primary} size="small" />
                                        <AppText style={styles.statusChipText}>{t('Fetching your location...')}</AppText>
                                    </View>
                                ) : null}
                                {locationError ? <AppText style={styles.errorText}>{t(locationError)}</AppText> : null}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={isModalVisible && Boolean(selectedUpdate)} transparent animationType="slide" onRequestClose={closeModal}>
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <AppText style={styles.modalTitle}>{t('Government Update')}</AppText>
                                    <TouchableOpacity onPress={closeModal}>
                                        <AppIcon name="close" size={22} color={theme.colors.icon} />
                                    </TouchableOpacity>
                                </View>
                                {selectedUpdate && (
                                    <>
                                        <Image source={{ uri: selectedUpdate.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                                        <AppText style={styles.modalUpdateTitle}>{selectedUpdate.title}</AppText>
                                        <AppText style={styles.modalMeta}>
                                            {selectedUpdate.source || t('MSME Ministry')} • {formatPublishedAt(selectedUpdate.publishedAt)}
                                        </AppText>
                                        <AppText style={styles.modalDescription}>{selectedUpdate.description}</AppText>
                                        <AppButton
                                            label={t('Get Similar Updates')}
                                            onPress={() => {
                                                fetchGovernmentUpdates(selectedUpdate.title);
                                                closeModal();
                                            }}
                                            style={styles.modalButton}
                                            labelStyle={styles.modalButtonLabel}
                                            icon="refresh"
                                        />
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};
const createStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            paddingTop: 40,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingBottom: 20,
            gap: 12,
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flex: 1,
            marginLeft: 10,
        },
        userDetails: {
            flex: 1,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
        },
        userName: {
            fontWeight: 'bold',
            fontSize: 16,
            flexShrink: 1,
        },
        greeting: {
            fontSize: 12,
            color: theme.colors.subtext,
            flexShrink: 1,
        },
        badge: {
            position: 'absolute',
            top: 0,
            right: 0,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.error,
        },
        headerActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
        },
        iconButton: {
            padding: 8,
            borderRadius: 12,
            backgroundColor: theme.colors.surfaceVariant,
            position: 'relative',
            elevation: 1,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingBottom: 100,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        card: {
            width: '47%',
            borderRadius: 16,
            padding: 14,
            backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)',
            shadowColor: 'rgba(15, 23, 42, 0.15)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: theme.colors.surfaceVariant,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },
        cardTitle: {
            fontSize: 13,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 4,
            color: theme.colors.text,
        },
        viewStatus: {
            fontSize: 10,
            color: theme.colors.subtext,
            textAlign: 'center',
        },
        section: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 12,
            color: theme.colors.text,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        refreshButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        refreshText: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.colors.primary,
        },
        refreshDisabled: {
            color: theme.colors.subtext,
        },
        statusText: {
            fontSize: 12,
            color: theme.colors.subtext,
            marginBottom: 8,
        },
        errorText: {
            fontSize: 12,
            color: theme.colors.error,
            marginBottom: 8,
        },
        horizontalScroll: {
            paddingRight: 20,
        },
        horizontalCardWrapper: {
            width: 280,
            marginRight: 16,
        },
        loadingCard: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        verticalList: {
            gap: 0,
        },
        mapModalContent: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            gap: 12,
        },
        mapModalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        mapModalTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
        },
        mapContainerModal: {
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceVariant,
        },
        map: {
            height: 260,
            width: '100%',
        },
        mapStatusRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
        },
        statusChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.colors.surfaceVariant,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
        },
        statusChipText: {
            color: theme.colors.text,
            fontSize: 12,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: 'center',
            padding: 24,
        },
        modalContent: {
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 6,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        modalTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
        },
        modalImage: {
            width: '100%',
            height: 160,
            borderRadius: 16,
            marginBottom: 16,
        },
        modalUpdateTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 6,
        },
        modalMeta: {
            fontSize: 12,
            color: theme.colors.subtext,
            marginBottom: 12,
        },
        modalDescription: {
            fontSize: 14,
            color: theme.colors.text,
            lineHeight: 20,
            marginBottom: 20,
        },
        modalButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
        },
        modalButtonLabel: {
            textTransform: 'none',
            fontWeight: '600',
        },
    });

export { BeneficiaryDashboardScreen };
export default BeneficiaryDashboardScreen;
