export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function printReceipt(order: any) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    };

    // Expand items based on quantity
    const individualItems: any[] = [];
    (order.items || []).forEach((item: any) => {
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
            individualItems.push(item);
        }
    });

    const totalItems = individualItems.length;

    // Se não houver itens, não imprime nada
    if (totalItems === 0) return;

    // Build the HTML content with a page break between each item
    let htmlContent = '';

    individualItems.forEach((item, index) => {
        const currentItemNumber = index + 1;
        
        const lines = [
            "ESCOTEIROS", 
            `PEDIDO: #${order.order_number}`,
            `PARTE: ${currentItemNumber} de ${totalItems}`,
            `ITEM: ${item.name}`,
            `DATA: ${new Date(order.created_at || Date.now()).toLocaleString()}`,
        ];

        const receiptText = lines.join('\n');
        console.log(receiptText); // Mantém o log no console para debug

        htmlContent += `
            <div class="receipt-page">
                ${receiptText}
            </div>
        `;
    });

    // Create a temporary hidden iframe to actually print silently
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const printDocument = iframe.contentWindow?.document;
    
    if (printDocument) {
        printDocument.write(`
            <html>
                <head>
                    <title>Cupom #${order.order_number}</title>
                    <style>
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            padding: 0; 
                            margin: 0;
                            white-space: pre-wrap; 
                            font-size: 14px; 
                            font-weight: bold; 
                            line-height: 1.2;
                            color: #000; 
                        }
                        .receipt-page {
                            width: 300px;
                            margin: 0 auto;
                            padding: 20px;
                            page-break-after: always; /* Força o corte/pulo de página entre os cupons */
                        }
                        .receipt-page:last-child {
                            page-break-after: auto; /* Evita uma página em branco no final */
                        }
                        @media print {
                            @page { size: auto; margin: 0mm; } /* Remove margens do navegador */
                            body { margin: 0; width: 100%; padding: 0; } 
                            .receipt-page {
                                width: 100%;
                                padding: 2mm; /* Pequeno padding interno para não cortar texto */
                                margin: 0;
                            }
                        }
                    </style>
                </head>
                <body>${htmlContent}</body>
            </html>
        `);
        printDocument.close();
        
        // Wait a tiny bit for the iframe content to render, then print
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Cleanup iframe after printing
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }
        }, 250);
    } else {
        console.error("Não foi possível criar o iframe para impressão silenciosa.");
    }
}

