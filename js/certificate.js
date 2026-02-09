/**
 * Generates a high-resolution professional certificate using HTML5 Canvas.
 * @param {string} studentName - The name of the student.
 * @param {string} courseName - The name of the course.
 * @param {string} date - The completion date.
 * @returns {Promise<string>} - A Promise that resolves to the DataURL of the generated certificate image.
 */
async function generateCertificate(studentName, courseName, date) {
    // Canvas dimensions (A4 Landscape at high resolution)
    const width = 2000;
    const height = 1414;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Load Fonts
    // We assume these fonts are available or loaded via Google Fonts in the HTML.
    // If not, we attempt to load them here dynamically for the context of this function,
    // though for best performance they should be in the <head>.
    const fontPrimary = 'Playfair Display';
    const fontScript = 'Great Vibes'; // Or 'Allura', 'Dancing Script'
    const fontSans = 'Arial'; // Fallback

    // Load Images Helper
    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    };

    try {
        // Load all assets in parallel
        const [logoImg, ceoSignImg, directorSignImg] = await Promise.all([
            loadImage('assets/logo-main.png'),
            loadImage('assets/ceo sign.png'),
            loadImage('assets/directer sign.png')
        ]);

        // --- 1. Background ---
        ctx.fillStyle = '#FDFBF7'; // Light cream/ivory
        ctx.fillRect(0, 0, width, height);

        // --- 2. Border ---
        // Outer double line
        const borderPadding = 60;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#004d40'; // Dark teal
        ctx.strokeRect(borderPadding, borderPadding, width - borderPadding * 2, height - borderPadding * 2);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#DAA520'; // Gold
        ctx.strokeRect(borderPadding + 15, borderPadding + 15, width - (borderPadding + 15) * 2, height - (borderPadding + 15) * 2);

        // --- 3. Header (Logo & Title) ---
        // Logo
        const logoWidth = 200;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        const logoX = (width - logoWidth) / 2;
        const logoY = 150;
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#004d40'; // Dark Teal
        ctx.font = `bold 80px "${fontPrimary}", serif`;
        ctx.fillText('CERTIFICATE OF COMPLETION', width / 2, 450);

        // --- 4. Content ---
        ctx.fillStyle = '#333'; // Dark Gray
        ctx.font = `italic 40px "${fontPrimary}", serif`;
        ctx.fillText('This is to certify that', width / 2, 580);

        // Student Name
        ctx.fillStyle = '#004d40'; // Dark Teal
        ctx.font = `120px "${fontScript}", cursive`; // Elegant script
        ctx.fillText(studentName, width / 2, 750);

        // Separator line under name
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#DAA520'; // Gold
        ctx.beginPath();
        ctx.moveTo((width / 2) - 300, 780);
        ctx.lineTo((width / 2) + 300, 780);
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = `italic 40px "${fontPrimary}", serif`;
        ctx.fillText('has successfully completed the course', width / 2, 880);

        // Course Name
        ctx.fillStyle = '#000'; // Black
        ctx.font = `bold 70px "${fontPrimary}", serif`;
        ctx.fillText(courseName, width / 2, 1000);

        // Date
        ctx.font = `30px "${fontPrimary}", serif`;
        ctx.fillStyle = '#555';
        ctx.fillText(`Date: ${date}`, width / 2, 1100);

        // --- 5. Signatures ---
        const bottomY = 1200;
        const sigWidth = 250;
        const sigHeight = 100; // Approximate

        // CEO Signature (Left)
        // Scale signature maintaining aspect ratio
        const ceoScale = Math.min(sigWidth / ceoSignImg.width, sigHeight / ceoSignImg.height);
        const ceoW = ceoSignImg.width * ceoScale;
        const ceoH = ceoSignImg.height * ceoScale;
        
        const ceoX = 400;
        ctx.drawImage(ceoSignImg, ceoX - (ceoW / 2), bottomY - ceoH, ceoW, ceoH);
        
        ctx.beginPath();
        ctx.moveTo(ceoX - 150, bottomY + 10);
        ctx.lineTo(ceoX + 150, bottomY + 10);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `bold 30px "${fontPrimary}", serif`;
        ctx.fillStyle = '#333';
        ctx.fillText('CEO', ceoX, bottomY + 50);

        // Director Signature (Right)
        const dirScale = Math.min(sigWidth / directorSignImg.width, sigHeight / directorSignImg.height);
        const dirW = directorSignImg.width * dirScale;
        const dirH = directorSignImg.height * dirScale;

        const dirX = width - 400;
        ctx.drawImage(directorSignImg, dirX - (dirW / 2), bottomY - dirH, dirW, dirH);

        ctx.beginPath();
        ctx.moveTo(dirX - 150, bottomY + 10);
        ctx.lineTo(dirX + 150, bottomY + 10);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `bold 30px "${fontPrimary}", serif`;
        ctx.fillStyle = '#333';
        ctx.fillText('Director', dirX, bottomY + 50);

        // Return Data URL
        return canvas.toDataURL('image/png');

    } catch (error) {
        console.error('Error generating certificate:', error);
        throw error;
    }
}
