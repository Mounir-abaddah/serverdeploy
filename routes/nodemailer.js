const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Créer un transporteur Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'mounirabaddah6@gmail.com',
        pass: 'hnbf seqq tjgy bsyi' // Remplacez par votre mot de passe réel
    }
});

// Fonction pour générer un PDF avec les détails de la réservation
const generateReservationPDF = (reservationData, filename) => {
    // Créer un nouveau document PDF
    const doc = new PDFDocument();

    // Définir les couleurs et les styles
    const primaryColor = '#4CAF50'; // Vert
    const secondaryColor = '#FFC107'; // Jaune
    const textColor = '#333333'; // Gris foncé

    // Fonction pour formater les horaires
    const formatTimings = (timings) => {
        return timings.map(timing => {
            const date = new Date(timing);
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        });
    };

    // Ajouter un arrière-plan
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f5f5f5'); // Arrière-plan gris clair

    // En-tête
    doc.fillColor(primaryColor).fontSize(26).text('Confirmation de Réservation', { align: 'center', underline: true }).moveDown(1.5);

    // Détails de la réservation
    doc.fillColor(textColor).fontSize(18).text('Détails de la réservation :\n', { align: 'left' }).moveDown();

    const info = [
        { label: 'Nom complet', value: `${reservationData.firstName} ${reservationData.lastName}` },
        { label: 'Téléphone', value: reservationData.phoneNumber },
        { label: 'Adresse', value: reservationData.adress },
        { label: 'E-mail', value: reservationData.email },
        { label: 'Horaire', value: `du ${formatTimings(reservationData.timings).join(' à ')}` }
    ];

    // Ajouter un tableau avec les informations
    const tableTop = 200;
    const itemWidth = 300;
    const rowHeight = 30;
    const colWidth = 250;

    // Dessiner les lignes du tableau
    doc.lineWidth(1);

    for (let i = 0; i <= 5; i++) {
        doc.moveTo(50, tableTop + (i * rowHeight))
            .lineTo(50 + (colWidth * 2), tableTop + (i * rowHeight))
            .stroke();
    }

    // Dessiner les colonnes du tableau
    for (let i = 0; i <= 2; i++) {
        doc.moveTo(50 + (i * colWidth), tableTop)
            .lineTo(50 + (i * colWidth), tableTop + (rowHeight * 5))
            .stroke();
    }

    // Ajouter le contenu du tableau
    const tableContent = [
        ["Nom complet", `${reservationData.firstName} ${reservationData.lastName}`],
        ["Téléphone", reservationData.phoneNumber],
        ["Adresse", reservationData.adress],
        ["E-mail", reservationData.email],
        ["Horaire", `du ${formatTimings(reservationData.timings).join(' à ')}`]
    ];

    tableContent.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            doc.fontSize(14).fillColor(textColor)
                .text(cell, 55 + (colIndex * colWidth), tableTop + 5 + (rowIndex * rowHeight), {
                    width: colWidth - 10,
                    align: 'left'
                });
        });
    });

    // Ajouter un espace après le tableau
    doc.moveDown(2);

    // Pied de page
    doc.fillColor(secondaryColor).fontSize(12)
       .text('Merci pour votre réservation!', { align: 'center', lineGap: 10 })
       .text('Nous espérons vous voir bientôt.', { align: 'center' });

    // Enregistrer le PDF sur le disque
    doc.pipe(fs.createWriteStream(`${filename}.pdf`));
    doc.end();
};

// Fonction pour envoyer un e-mail avec le PDF en pièce jointe
const sendConfirmationEmail = (email, filename) => {
    // Définir les options de l'e-mail avec le PDF en pièce jointe
    const mailOptions = {
        from: 'mounirabaddah6@gmail.com',
        to: email,
        subject: 'Confirmation de réservation',
        text: 'Merci pour votre réservation! Trouvez ci-joint la confirmation de votre réservation.',
        attachments: [
            {
                filename: `${filename}.pdf`,
                path: `${filename}.pdf`
            }
        ]
    };

    // Envoyer l'e-mail avec le PDF en pièce jointe
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
        } else {
            console.log('E-mail envoyé :', info.response);
        }
    });
};

module.exports = { generateReservationPDF, sendConfirmationEmail };
