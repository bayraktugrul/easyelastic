class Toast {
    show(message, type = 'info') {
        const config = {
            success: {
                icon: '<i class="fas fa-check-circle"></i>',
                color: '#2ecc71',
                background: '#f0fff4'
            },
            error: {
                icon: '<i class="fas fa-times-circle"></i>',
                color: '#e74c3c',
                background: '#fff5f5'
            },
            warning: {
                icon: '<i class="fas fa-exclamation-triangle"></i>',
                color: '#f1c40f',
                background: '#fffbeb'
            },
            info: {
                icon: '<i class="fas fa-info-circle"></i>',
                color: '#3498db',
                background: '#ebf8ff'
            }
        };

        const style = config[type] || config.info;

        Toastify({
            text: `<div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px; color: ${style.color}">
                        ${style.icon}
                    </span>
                    <span>${message}</span>
                   </div>`,
            duration: 3000,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            escapeMarkup: false,
            className: "toastify-custom",
            style: {
                background: style.background,
                color: '#2d3436',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '12px 24px',
                borderRadius: '8px',
                border: `1px solid ${style.color}20`,
                minWidth: '300px'
            }
        }).showToast();
    }
}

export default new Toast(); 