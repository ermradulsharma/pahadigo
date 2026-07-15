import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Circle, G, Font } from '@react-pdf/renderer';

Font.register({
    family: 'NotoSansDevanagari',
    src: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf'
});

const PRIMARY_COLOR = '#32007a';
const LIGHT_PURPLE = '#ece6f9';
const LIGHT_BG = '#f8f9fa';
const TEXT_COLOR = '#374151';
const MUTED_TEXT = '#6b7280';
const BORDER_COLOR = '#e5e7eb';
const WHITE_COLOR = '#ffffff';
const LIGHT_GRAY = '#d1d5db';


const DETAILS = [
    { label: "brandName", value: "TRIPDHARA TRAVELS" },
    { label: "tagLineHindi", value: "जहाँ नदी की धारा, वहां सुकून हमारा" },
    { label: "tagLineEnglish", value: "Where the river flows, peace begins" },
    { label: "phone", value: "+91 9971883682" },
    { label: "email", value: "contact@tripdhara.com" },
    { label: "website", value: "https://tripdhara.com" },
    { label: "address", value: "Gali Number 13, Meera Nagar, Garhi Maychak, Veerbhadra, Rishikesh, Uttarakhand 249202" },
]



const IconLocation = ({ color = BORDER_COLOR, size = "10" }) => <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={color} /></Svg>;
const IconEmail = ({ color = BORDER_COLOR, size = "10" }) => <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill={color} /></Svg>;
const IconPhone = ({ color = BORDER_COLOR, size = "10" }) => <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill={color} /></Svg>;
const IconWeb = ({ color = BORDER_COLOR, size = "10" }) => <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c1.03-1.85 2.72-3.23 4.75-3.83C9.28 5.17 8.76 6.54 8.36 8z" fill={color} /></Svg>;
const IconBuilding = ({ color = PRIMARY_COLOR }) => <Svg width="14" height="14" viewBox="0 0 24 24"><Path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill={color} /></Svg>;
const IconUser = ({ color = PRIMARY_COLOR }) => <Svg width="14" height="14" viewBox="0 0 24 24"><Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={color} /></Svg>;
const IconBag = ({ color = PRIMARY_COLOR }) => <Svg width="12" height="12" viewBox="0 0 24 24"><Path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill={color} /></Svg>;
const IconCheck = ({ color = PRIMARY_COLOR }) => <Svg width="16" height="16" viewBox="0 0 24 24"><Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={color} /></Svg>;
const IconNotes = ({ color = PRIMARY_COLOR }) => <Svg width="16" height="16" viewBox="0 0 24 24"><Path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill={color} /></Svg>;
const IconBank = ({ color = PRIMARY_COLOR }) => <Svg width="16" height="16" viewBox="0 0 24 24"><Path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z" fill={color} /></Svg>;

const FakeSignature = () => (
    <Svg width="120" height="40" viewBox="0 0 200 60">
        <Path d="M20 40 Q 40 20, 60 40 T 100 40 T 140 30 T 180 40" fill="none" stroke="#32007a" strokeWidth="2" />
        <Path d="M50 30 Q 70 10, 90 50" fill="none" stroke="#32007a" strokeWidth="2" />
    </Svg>
);

const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', backgroundColor: WHITE_COLOR, color: TEXT_COLOR },
    headerBackground: { backgroundColor: PRIMARY_COLOR, color: WHITE_COLOR, padding: 25, flexDirection: 'row', justifyContent: 'space-between' },
    headerLeft: { width: '65%', flexDirection: 'row' },
    logoWrapper: { marginRight: 15 },
    headerTextWrapper: { flex: 1 },
    brandTitle: { fontSize: 20, fontWeight: 'bold', color: WHITE_COLOR },
    brandSubtitle: { fontSize: 8, marginBottom: 10, marginTop: 2, color: LIGHT_GRAY, fontFamily: 'NotoSansDevanagari' },
    iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    iconText: { fontSize: 8, color: BORDER_COLOR, marginLeft: 8 },
    iconTextDark: { fontSize: 9, color: MUTED_TEXT, marginLeft: 8, lineHeight: 1.4 },
    headerRightBox: { backgroundColor: WHITE_COLOR, borderRadius: 8, padding: 15, width: '30%', alignSelf: 'flex-start' },
    invoiceTitle: { fontSize: 22, fontWeight: 'bold', color: PRIMARY_COLOR, marginBottom: 15 },
    infoRow: { display: 'flex', flexDirection: 'row', marginBottom: 8, alignItems: 'center', justifyContent: 'space-between' },
    infoLabel: { width: 55, fontSize: 8, fontWeight: 'bold', color: TEXT_COLOR },
    infoColon: { width: 10, fontSize: 8, fontWeight: 'bold', color: TEXT_COLOR },
    infoValue: { flex: 1, fontSize: 8, color: PRIMARY_COLOR, fontWeight: 'bold', textAlign: 'right' },
    billedContainer: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 20 },
    billedBox: { display: 'flex', backgroundColor: WHITE_COLOR, borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 8, padding: 15, width: '48%' },
    billedTitleWrapper: { backgroundColor: LIGHT_PURPLE, padding: 8, borderRadius: 6, marginRight: 10 },
    billedTitleRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    billedTitle: { fontSize: 11, fontWeight: 'bold', color: PRIMARY_COLOR },
    billedName: { fontSize: 11, fontWeight: 'bold', color: PRIMARY_COLOR, marginBottom: 8 },
    billedText: { fontSize: 9, color: TEXT_COLOR, lineHeight: 1.4, marginBottom: 4 },
    tableContainer: { marginHorizontal: 25, marginTop: 20, borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 6, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: PRIMARY_COLOR, paddingVertical: 12, paddingHorizontal: 10 },
    th: { fontSize: 8, fontWeight: 'bold', color: WHITE_COLOR },
    tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' },
    td: { fontSize: 9, color: TEXT_COLOR },
    col1: { width: '5%', textAlign: 'center' },
    col2: { width: '35%' },
    col3: { width: '10%', textAlign: 'center' },
    col4: { width: '15%', textAlign: 'center' },
    col5: { width: '10%', textAlign: 'center' },
    col6: { width: '12%', textAlign: 'center' },
    col7: { width: '13%', textAlign: 'center' },
    bottomContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 25 },
    bottomLeft: { width: '48%' },
    bottomRight: { width: '48%' },
    sectionBlock: { marginBottom: 10 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: PRIMARY_COLOR, paddingBottom: 6 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', color: PRIMARY_COLOR, marginLeft: 8 },
    numberedList: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    numberCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 1 },
    numberText: { color: WHITE_COLOR, fontSize: 7, fontWeight: 'bold' },
    termsText: { fontSize: 8, color: TEXT_COLOR, lineHeight: 1.2, flex: 1 },
    notesText: { fontSize: 8, color: TEXT_COLOR, lineHeight: 1.5 },
    bankRowDetails: { flexDirection: 'row', marginBottom: 5 },
    bankLabel: { width: 110, fontSize: 8, fontWeight: 'bold', color: TEXT_COLOR },
    bankColon: { width: 10, fontSize: 8, color: TEXT_COLOR },
    bankValue: { fontSize: 8, color: TEXT_COLOR, flex: 1 },
    summaryBox: { backgroundColor: LIGHT_BG, borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: BORDER_COLOR, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 9, color: TEXT_COLOR },
    summaryValue: { fontSize: 9, color: TEXT_COLOR, fontWeight: 'bold' },
    totalBlock: { backgroundColor: PRIMARY_COLOR, padding: 10, display: 'flex', alignItems: "center", flexDirection: 'row', justifyContent: 'space-between', borderRadius: 6, marginBottom: 10 },
    totalLabel: { fontSize: 11, fontWeight: 'bold', color: WHITE_COLOR },
    totalValue: { fontSize: 14, fontWeight: 'bold', color: WHITE_COLOR },
    wordsBox: { backgroundColor: LIGHT_PURPLE, borderRadius: 6, padding: 12, flexDirection: 'row', alignItems: 'center' },
    wordsIconCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    wordsIconText: { fontSize: 7, color: PRIMARY_COLOR, fontWeight: 'bold' },
    wordsContent: { flex: 1 },
    wordsTitle: { fontSize: 7, fontWeight: 'bold', color: PRIMARY_COLOR, marginBottom: 4 },
    wordsValue: { fontSize: 8, color: TEXT_COLOR, lineHeight: 1.3 },
    signatureBlock: { marginTop: 40, alignItems: 'center', alignSelf: 'flex-end', width: 180 },
    signatureLine: { borderTopWidth: 1, borderTopColor: TEXT_COLOR, width: '100%', marginBottom: 5 },
    signatureTitle: { fontSize: 9, fontWeight: 'bold', color: PRIMARY_COLOR },
    signatureName: { fontSize: 8, color: TEXT_COLOR, marginTop: 2, fontStyle: 'italic' },
    footer: { marginTop: 10, marginHorizontal: 10, padding: 15, display: 'flex', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: LIGHT_PURPLE, borderRadius: 6 },
    footerIcon: { marginRight: 6 },
    footerText: { fontSize: 8, color: PRIMARY_COLOR, fontWeight: 'bold' }
});

const InvoiceDocument = ({ booking }) => {
    const numberToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if ((num = num.toString()).length > 9) return 'Amount too large';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return ''; 
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str.trim() ? str.trim() + ' Only' : 'Zero Only';
    };

    const getInvoiceData = (b) => {
        if (!b) {
            return {
                invoiceNo: 'INV-2026-0142',
                invoiceDate: '18 June 2026',
                dueDate: '25 June 2026',
                traveller: {
                    name: 'Nur Aina Binti Rahman',
                    address: 'No. 22, Jalan Melur 5, Shah Alam, Selangor, Malaysia',
                    email: 'nuraina.rahman@gmail.com',
                    phone: '+60 12-345 6789'
                },
                items: [
                    { desc: 'Bali Holiday Package (4D/3N)', qty: 2, unitPrice: 850.00, taxRate: '18%', taxAmount: 153.00, amount: 1853.00 },
                ],
                transaction: {
                    id: '5648 1234 5678',
                    method: 'Bank Transfer, Credit/Debit Card',
                    bank: 'Maybank Islamic Berhad',
                    swift: 'MBBEMYKL'
                },
                summary: {
                    subTotal: 3400.00,
                    discount: 0,
                    serviceFee: 50.00,
                    taxAmount: 0.00,
                    processing: 20.00,
                    total: 3470.00,
                    totalWords: numberToWords(3470),
                    currency: 'INR'
                }
            };
        }
        return {
            invoiceNo: b.bookingCode || 'N/A',
            invoiceDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString(),
            dueDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString(),
            traveller: {
                name: b.traveller?.name || b.user?.name || 'Guest User',
                address: b.user?.address ? `${b.user.address.addressLine1 || ''}, ${b.user.address.city || ''}` : '',
                email: b.traveller?.email || b.user?.email || '',
                phone: b.traveller?.phone || b.user?.phone || ''
            },
            items: [
                {
                    desc: `${b.item?.title || 'Travel Booking'} (${b.occupancy?.adults || 1} Adults${b.occupancy?.children ? `, ${b.occupancy.children} Children` : ''})`,
                    qty: b.occupancy?.units || 1,
                    unitPrice: b.pricing?.basePrice || 0,
                    taxRate: b.pricing?.taxRate ? `${b.pricing.taxRate}%` : '18%',
                    taxAmount: b.pricing?.tax || 0,
                    amount: (b.pricing?.subTotal || 0) + (b.pricing?.tax || 0)
                }
            ],
            transaction: {
                id: b.payment?.paymentId || b.payment?.orderId || b._id?.toString() || 'N/A',
                method: b.payment?.gateway || 'Online Payment',
                status: b.paymentStatus || 'PAID',
                date: b.payment?.paidAt ? new Date(b.payment.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()
            },
            summary: {
                subTotal: b.pricing?.subTotal || b.pricing?.basePrice || 0,
                discount: b.pricing?.discount || 0,
                serviceFee: b.pricing?.serviceFee || 0,
                processing: 0,
                taxAmount: b.pricing?.tax || 0,
                total: b.pricing?.total || 0,
                totalWords: numberToWords(Math.round(b.pricing?.total || 0)),
                currency: b.pricing?.currency || 'INR'
            }
        };
    };
    const data = getInvoiceData(booking);
    const cur = data.summary.currency;
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerBackground}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerTextWrapper}>
                            <Text style={styles.brandTitle}>{DETAILS[0].value}</Text>
                            <Text style={styles.brandSubtitle}>{DETAILS[1].value}</Text>
                            <View style={[styles.iconRow, { alignItems: 'flex-start' }]}>
                                <View style={{ marginTop: 2 }}><IconLocation size="10" /></View>
                                <Text style={[styles.iconText, { width: 220, lineHeight: 1.4 }]}>{DETAILS[5].value}</Text>
                            </View>
                            <View style={styles.iconRow}><IconEmail size="10" /><Text style={styles.iconText}>{DETAILS[3].value}</Text></View>
                            <View style={styles.iconRow}><IconPhone size="10" /><Text style={styles.iconText}>{DETAILS[2].value}</Text></View>
                            <View style={styles.iconRow}><IconWeb size="10" /><Text style={styles.iconText}>{DETAILS[4].value}</Text></View>
                        </View>
                    </View>
                    <View style={styles.headerRightBox}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Invoice No.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{data.invoiceNo}</Text>
                        </View>
                        <View style={styles.infoRow}><Text style={styles.infoLabel}>Invoice Date</Text><Text style={styles.infoColon}>:</Text><Text style={styles.infoValue}>{data.invoiceDate}</Text></View>
                        <View style={styles.infoRow}><Text style={styles.infoLabel}>Due Date</Text><Text style={styles.infoColon}>:</Text><Text style={styles.infoValue}>{data.dueDate}</Text></View>
                    </View>
                </View>
                <View style={styles.billedContainer}>
                    <View style={styles.billedBox}>
                        <View style={styles.billedTitleRow}>
                            <View style={styles.billedTitleWrapper}><IconBuilding color={PRIMARY_COLOR} /></View>
                            <Text style={styles.billedTitle}>BILLED BY</Text>
                        </View>
                        <Text style={styles.billedName}>Tripdhara Travels</Text>
                        <Text style={styles.billedText}>Gali Number 13, Meera Nagar, Garhi Maychak, Veerbhadra, Rishikesh, Uttarakhand 249202</Text>
                        <View style={[styles.iconRow, { marginTop: 5 }]}><IconPhone color={PRIMARY_COLOR} /><Text style={styles.iconTextDark}>+91 9536489063</Text></View>
                        <View style={styles.iconRow}><IconEmail color={PRIMARY_COLOR} /><Text style={styles.iconTextDark}>info@tripdhara.com</Text></View>
                    </View>
                    <View style={styles.billedBox}>
                        <View style={styles.billedTitleRow}>
                            <View style={styles.billedTitleWrapper}><IconUser color={PRIMARY_COLOR} /></View>
                            <Text style={styles.billedTitle}>BILLED TO</Text>
                        </View>
                        <Text style={styles.billedName}>{data.traveller.name}</Text>
                        <Text style={styles.billedText}>{data.traveller.address}</Text>
                        <View style={[styles.iconRow, { marginTop: 5 }]}><IconEmail color={PRIMARY_COLOR} /><Text style={styles.iconTextDark}>{data.traveller.email}</Text></View>
                        <View style={styles.iconRow}><IconPhone color={PRIMARY_COLOR} /><Text style={styles.iconTextDark}>{data.traveller.phone}</Text></View>
                    </View>
                </View>
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.col1]}>#</Text>
                        <Text style={[styles.th, styles.col2, { textAlign: 'left' }]}>SERVICE DESCRIPTION</Text>
                        <Text style={[styles.th, styles.col3]}>QTY</Text>
                        <Text style={[styles.th, styles.col4]}>UNIT PRICE</Text>
                        <Text style={[styles.th, styles.col5]}>TAX RATE</Text>
                        <Text style={[styles.th, styles.col6]}>TAX AMOUNT</Text>
                        <Text style={[styles.th, styles.col7]}>TOTAL</Text>
                    </View>
                    {data.items.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <Text style={[styles.td, styles.col1, { fontWeight: 'bold' }]}>{index + 1}</Text>
                            <View style={[styles.col2, { flexDirection: 'row', alignItems: 'center' }]}>
                                <IconBag color={PRIMARY_COLOR} />
                                <Text style={[styles.td, { marginLeft: 8 }]}>{item.desc}</Text>
                            </View>
                            <Text style={[styles.td, styles.col3]}>{item.qty}</Text>
                            <Text style={[styles.td, styles.col4]}>{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                            <Text style={[styles.td, styles.col5]}>{item.taxRate}</Text>
                            <Text style={[styles.td, styles.col6]}>{item.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                            <Text style={[styles.td, styles.col7]}>{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.bottomContainer}>
                    <View style={styles.bottomLeft}>
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionTitleRow}>
                                <IconCheck />
                                <Text style={styles.sectionTitle}>TERMS & CONDITIONS</Text>
                            </View>
                            <View style={styles.numberedList}>
                                <View style={styles.numberCircle}><Text style={styles.numberText}>1</Text></View>
                                <Text style={styles.termsText}>Full payment is required to confirm your booking.</Text>
                            </View>
                            <View style={styles.numberedList}>
                                <View style={styles.numberCircle}><Text style={styles.numberText}>2</Text></View>
                                <Text style={styles.termsText}>Cancellations made 15 days or less before departure are non-refundable.</Text>
                            </View>
                            <View style={styles.numberedList}>
                                <View style={styles.numberCircle}><Text style={styles.numberText}>3</Text></View>
                                <Text style={styles.termsText}>Itinerary and pricing are subject to change without prior notice.</Text>
                            </View>
                            <View style={styles.numberedList}>
                                <View style={styles.numberCircle}><Text style={styles.numberText}>4</Text></View>
                                <Text style={styles.termsText}>Vendor is not liable for delays caused by unforeseen circumstances.</Text>
                            </View>
                        </View>
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionTitleRow}>
                                <IconNotes />
                                <Text style={styles.sectionTitle}>ADDITIONAL NOTES</Text>
                            </View>
                            <Text style={styles.notesText}>Please ensure you carry a valid passport/ID throughout your trip. Check all booking details and travel documents upon receipt. For any changes or assistance, kindly contact your travel consultant.</Text>
                        </View>
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionTitleRow}>
                                <IconBank />
                                <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
                            </View>
                            <View style={styles.bankRowDetails}><Text style={styles.bankLabel}>Transaction ID</Text><Text style={styles.bankColon}>:</Text><Text style={styles.bankValue}>{data.transaction.id}</Text></View>
                            <View style={styles.bankRowDetails}><Text style={styles.bankLabel}>Payment Method</Text><Text style={styles.bankColon}>:</Text><Text style={styles.bankValue}>{data.transaction.method}</Text></View>
                            <View style={styles.bankRowDetails}><Text style={styles.bankLabel}>Payment Status</Text><Text style={styles.bankColon}>:</Text><Text style={[styles.bankValue, { color: '#16a34a', fontWeight: 'bold' }]}>{data.transaction.status || 'PAID'}</Text></View>
                            <View style={styles.bankRowDetails}><Text style={styles.bankLabel}>Payment Date</Text><Text style={styles.bankColon}>:</Text><Text style={styles.bankValue}>{data.transaction.date || data.invoiceDate}</Text></View>
                        </View>
                    </View>
                    <View style={styles.bottomRight}>
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>SUBTOTAL</Text><Text style={styles.summaryValue}>{data.summary.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text></View>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>TAX ({data.items[0]?.taxRate})</Text><Text style={styles.summaryValue}>{data.summary.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text></View>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>SERVICE FEE</Text><Text style={styles.summaryValue}>{data.summary.serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text></View>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>DISCOUNT</Text><Text style={[styles.summaryValue, { color: '#16a34a' }]}>- {data.summary.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text></View>
                        </View>
                        <View style={styles.totalBlock}>
                            <Text style={styles.totalLabel}>TOTAL DUE AMOUNT</Text>
                            <Text style={styles.totalValue}>{cur} {data.summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={styles.wordsBox}>
                            <View style={styles.wordsIconCircle}><Text style={styles.wordsIconText}>{cur}</Text></View>
                            <View style={styles.wordsContent}>
                                <Text style={styles.wordsTitle}>INVOICE TOTAL IN WORDS:</Text>
                                <Text style={styles.wordsValue}>{data.summary.totalWords}</Text>
                            </View>
                        </View>
                        <View style={styles.signatureBlock}>
                            <FakeSignature />
                            <View style={styles.signatureLine}></View>
                            <Text style={styles.signatureTitle}>AUTHORIZED SIGNATURE</Text>
                            <Text style={styles.signatureName}>(Tripdhara Travels)</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.footer}>
                    <View style={styles.footerIcon}><IconLocation color={PRIMARY_COLOR} size="8" /></View>
                    <Text style={styles.footerText}>Thank you for choosing Tripdhara. We look forward to making your journey memorable!</Text>
                </View>
            </Page>
        </Document>
    );
};
export default InvoiceDocument;
