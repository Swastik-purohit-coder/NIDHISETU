import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { InfoCard } from '@/components/molecules/info-card';
import { useAuthStore } from '@/state/authStore';

export const BeneficiaryDashboardScreen = () => {
  const navigation = useNavigation();
  const profile = useAuthStore((state) => state.profile);

  const menuItems = [
    { title: 'Track Loan', icon: 'clipboard-text-clock-outline', color: '#A855F7' },
    { title: 'Upload Evidence', icon: 'cloud-upload-outline', color: '#A855F7' },
    { title: 'Geo-Camera', icon: 'camera-marker-outline', color: '#A855F7' },
    { title: 'Notifications', icon: 'bell-outline', color: '#A855F7' },
    { title: 'Contact Officer', icon: 'card-account-phone-outline', color: '#A855F7' },
    { title: 'My Profile', icon: 'account-circle-outline', color: '#A855F7' },
  ];

  const newsItems = [
    { title: 'Government updates', desc: 'Latest changes in MSME policies for 2025.', image: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&w=800&q=80' },
    { title: 'Loan scheme policy changes', desc: 'New subsidy rates announced for rural sectors.', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80' },
  ];

  const trainingItems = [
    { title: 'Job programs', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80' },
    { title: 'Learning videos', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80' },
    { title: 'Government skill centres', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
  ];

  const calculatorItems = [
    { title: 'EMI calculator', desc: 'Plan your repayment.', image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80' },
    { title: 'Subsidy calculator', desc: 'Check your benefits.', image: 'https://images.unsplash.com/photo-1565514020176-dbf2277f241e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Eligibility prediction', desc: 'Know your chances.', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80' },
  ];

  const grievanceItems = [
    { title: 'Submit issue', desc: 'Face any problem? Let us know.', image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=800&q=80' },
    { title: 'Track complaint', desc: 'Check status of your tickets.', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80' },
    { title: 'Officer response', desc: 'View replies from officials.', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80' },
  ];

  const handleMenuPress = (title: string) => {
    switch (title) {
      case 'Track Loan':
        navigation.navigate('PreviousSubmissions' as never);
        break;
      case 'Upload Evidence':
        navigation.navigate('UploadEvidence' as never);
        break;
      case 'Geo-Camera':
        navigation.navigate('LoanEvidenceCamera' as never);
        break;
      case 'Notifications':
        navigation.navigate('Notifications' as never);
        break;
      case 'Contact Officer':
        navigation.navigate('ContactOfficer' as never);
        break;
      case 'My Profile':
        navigation.navigate('BeneficiaryProfile' as never);
        break;
      default:
        console.warn('Unknown menu item:', title);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <AppIcon name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
            <Image 
                source={{ uri: profile?.avatarUrl || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                style={styles.avatar} 
            />
            <View>
                <AppText style={styles.userName}>{profile?.name ?? 'Gokul Kumari'}</AppText>
                <AppText style={styles.greeting}>Good morning</AppText>
            </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications' as never)}>
            <AppIcon name="bell-outline" size={24} color="#333" />
            <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Grid Menu */}
        <View style={styles.grid}>
            {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.card} onPress={() => handleMenuPress(item.title)}>
                    <View style={styles.iconContainer}>
                        <AppIcon name={item.icon} size={32} color={item.color} />
                    </View>
                    <AppText style={styles.cardTitle}>{item.title}</AppText>
                    <AppText style={styles.viewStatus}>View Status</AppText>
                </TouchableOpacity>
            ))}
        </View>

        {/* News & Announcements */}
        <View style={styles.section}>
            <AppText style={styles.sectionTitle}>News & Announcements</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {newsItems.map((item, index) => (
                    <View key={index} style={styles.horizontalCardWrapper}>
                        <InfoCard title={item.title} description={item.desc} image={item.image} variant="standard" />
                    </View>
                ))}
            </ScrollView>
        </View>

        {/* Training & Skill Development */}
        <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Training & Skill Development</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {trainingItems.map((item, index) => (
                    <View key={index} style={styles.horizontalCardWrapper}>
                        <InfoCard title={item.title} image={item.image} variant="overlay" />
                    </View>
                ))}
            </ScrollView>
        </View>

        {/* Financial Calculator */}
        <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Financial Calculator</AppText>
            <View style={styles.verticalList}>
                {calculatorItems.map((item, index) => (
                    <InfoCard 
                        key={index} 
                        title={item.title} 
                        description={item.desc} 
                        image={item.image} 
                        variant="standard" 
                        style={{marginBottom: 16}} 
                        onPress={() => {
                            if (item.title === 'EMI calculator') {
                                navigation.navigate('EmiCalculator' as never);
                            }
                        }}
                    />
                ))}
            </View>
        </View>

        {/* Complaint / Grievance Redressal */}
        <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Complaint / Grievance Redressal</AppText>
            <View style={styles.verticalList}>
                {grievanceItems.map((item, index) => (
                    <InfoCard key={index} title={item.title} description={item.desc} image={item.image} variant="standard" style={{marginBottom: 16}} />
                ))}
            </View>
        </View>
        
        <View style={{height: 100}} /> 
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginLeft: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    greeting: {
        fontSize: 12,
        color: '#666',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 20,
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        marginBottom: 10,
    },
    iconContainer: {
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    viewStatus: {
        fontSize: 10,
        color: '#999',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1F2937',
    },
    horizontalScroll: {
        paddingRight: 20,
    },
    horizontalCardWrapper: {
        width: 280,
        marginRight: 16,
    },
    verticalList: {
        gap: 0,
    },
});
