import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { QRCodeSVG } from 'qrcode.react';
import logoSm from "../../assets/images/logo-kamacash.png";
// Optional: Custom font
// Font.register({ family: 'Roboto', src: '/fonts/Roboto-Regular.ttf' });

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, lineHeight: 1.6, position: 'relative' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    logo: { width: 100, height: 40 },
    watermark: { position: 'absolute', fontSize: 50, color: '#E0E0E0', rotate: -45, top: 150, left: 80, opacity: 0.15 },
    title: { fontSize: 16, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
    sectionTitle: { fontSize: 12, marginTop: 12, marginBottom: 4, fontWeight: 'bold' },
    text: { marginBottom: 4 },
    signature: { marginTop: 25 },
    footer: { position: 'absolute', fontSize: 9, bottom: 20, left: 40, right: 40, textAlign: 'center', color: 'grey' },
    qr: { width: 70, height: 70, marginTop: 5 }
});

const AgreementPdf = ({ business, admin = { name: "Kamacaash Admin" } }) => {
    const agreementId = business.agreementReference || `AG-${business._id?.slice(0, 8)}`;

    // Generate QR code as data URL
    const qrData = `https://kamacaash.com/verify-agreement/${agreementId}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Watermark */}
                <Text style={styles.watermark}>Kamacaash Official</Text>

                {/* Header */}
                <View style={styles.header}>
                    {/* <img src={logoSm} alt="" height="22" /> */}
                    <Image src={logoSm} style={styles.logo} />
                    <Text>Agreement Ref: {agreementId}</Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>SERVICE & COMMISSION AssssGREEMENT</Text>

                {/* Parties */}
                <Text style={styles.text}>
                    This Service & Commission Agreement ("Agreement") is entered into between:
                </Text>
                <Text style={styles.text}>
                    Kamacaash Surplus Food Saver Platform ("Kamacaash", "Platform", "We") and {business.businessName} ("Business", "Partner", "You").
                </Text>

                {/* Sections */}
                <Text style={styles.sectionTitle}>1. Purpose of Agreement</Text>
                <Text style={styles.text}>
                    Kamacaash provides a digital platform that enables businesses to sell surplus food and discounted products.
                    This Agreement defines the partnership terms between Kamacaash and the Business.
                </Text>

                <Text style={styles.sectionTitle}>2. What the Business Will Receive</Text>
                <Text style={styles.text}>• Access to Kamacaash digital marketplace</Text>
                <Text style={styles.text}>• Increased visibility to customers</Text>
                <Text style={styles.text}>• Tools to manage surplus food listings</Text>
                <Text style={styles.text}>• Operational and technical support</Text>

                <Text style={styles.sectionTitle}>3. Business Responsibilities</Text>
                <Text style={styles.text}>• Provide safe and consumable food products</Text>
                <Text style={styles.text}>• Comply with local food safety regulations</Text>
                <Text style={styles.text}>• Maintain accurate listings and availability</Text>

                <Text style={styles.sectionTitle}>4. Commission & Revenue Sharing</Text>
                <Text style={styles.text}>Commission Rate: {business.contract?.commissionRate || 5}%</Text>
                <Text style={styles.text}>Currency: {business.currency || "USD"}</Text>
                <Text style={styles.text}>Payout Schedule: {business.contract?.payoutSchedule || "WEEKLY"}</Text>

                <Text style={styles.sectionTitle}>5. Termination & Agreement Breakdown</Text>
                <Text style={styles.text}>
                    This Agreement may be terminated in case of policy violations, fraudulent activities, repeated customer complaints,
                    inactivity, or written notice by either party.
                </Text>

                <Text style={styles.sectionTitle}>6. Legal & Jurisdiction</Text>
                <Text style={styles.text}>
                    This Agreement shall be governed by applicable laws in Somalia.
                </Text>

                {/* Signatures */}
                <View style={styles.signature}>
                    <Text>For Kamacaash Platform</Text>
                    <Text>Admin Name: {admin.name}</Text>
                    <Text>Signature: _______________________ Date: __________</Text>
                </View>

                <View style={styles.signature}>
                    <Text>For Business Partner</Text>
                    <Text>Business Name: {business.businessName}</Text>
                    <Text>Owner Name: {business.ownerName}</Text>
                    <Text>Signature: _______________________ Date: __________</Text>
                </View>

                {/* QR Code */}
                <View style={{ marginTop: 20 }}>
                    <Text>Verify Agreement:</Text>
                    <QRCodeSVG value={qrData} size={70} />

                </View>

                {/* Footer with page number */}
                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    fixed
                />

            </Page>
        </Document>
    );
};

export default AgreementPdf;

// import React from 'react';
// import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// const styles = StyleSheet.create({
//     page: { padding: 40, fontSize: 11, lineHeight: 1.6 },
//     title: { fontSize: 16, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
//     sectionTitle: { fontSize: 12, marginTop: 12, marginBottom: 4, fontWeight: 'bold' },
//     text: { marginBottom: 4 },
//     signature: { marginTop: 25 }
// });

// const AgreementPdf = ({ business }) => (
//     <Document>
//         <Page size="A4" style={styles.page}>
//             <Text style={styles.title}>SERVICE & COMMISSION AGREEMENT</Text>

//             <Text style={styles.text}>
//                 This Service & Commission Agreement ("Agreement") is entered into between:
//             </Text>

//             <Text style={styles.text}>
//                 Kamacaash Surplus Food Saver Platform ("Kamacaash", "Platform", "We")
//                 and {business.businessName} ("Business", "Partner", "You").
//             </Text>

//             <Text style={styles.sectionTitle}>1. Purpose of Agreement</Text>
//             <Text style={styles.text}>
//                 Kamacaash provides a digital platform that enables businesses to sell surplus
//                 food and discounted products. This Agreement defines the partnership terms
//                 between Kamacaash and the Business.
//             </Text>

//             <Text style={styles.sectionTitle}>2. What the Business Will Receive</Text>
//             <Text style={styles.text}>• Access to Kamacaash digital marketplace</Text>
//             <Text style={styles.text}>• Increased visibility to customers</Text>
//             <Text style={styles.text}>• Tools to manage surplus food listings</Text>
//             <Text style={styles.text}>• Operational and technical support</Text>

//             <Text style={styles.sectionTitle}>3. Business Responsibilities</Text>
//             <Text style={styles.text}>• Provide safe and consumable food products</Text>
//             <Text style={styles.text}>• Comply with local food safety regulations</Text>
//             <Text style={styles.text}>• Maintain accurate listings and availability</Text>

//             <Text style={styles.sectionTitle}>4. Commission & Revenue Sharing</Text>
//             <Text style={styles.text}>Commission Rate: 5%</Text>
//             <Text style={styles.text}>Currency: USD ($)</Text>
//             <Text style={styles.text}>
//                 Payout Schedule: {business.contract?.payoutSchedule || 'WEEKLY'}
//             </Text>

//             <Text style={styles.sectionTitle}>5. Termination & Agreement Breakdown</Text>
//             <Text style={styles.text}>
//                 This Agreement may be terminated in case of policy violations, fraudulent
//                 activities, repeated customer complaints, inactivity, or written notice
//                 by either party.
//             </Text>

//             <Text style={styles.sectionTitle}>6. Legal & Jurisdiction</Text>
//             <Text style={styles.text}>
//                 This Agreement shall be governed by applicable laws in Somalia.
//             </Text>

//             <View style={styles.signature}>
//                 <Text>For Kamacaash Platform</Text>
//                 <Text>Signature: _______________________ Date: __________</Text>
//             </View>

//             <View style={styles.signature}>
//                 <Text>For Business Partner</Text>
//                 <Text>Business Name: {business.businessName}</Text>
//                 <Text>Owner Name: {business.ownerName}</Text>
//                 <Text>Signature: _______________________ Date: __________</Text>
//             </View>
//         </Page>
//     </Document>
// );

// export default AgreementPdf;
