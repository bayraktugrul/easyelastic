class Toast {
    show(message, type = 'info') {
        const config = {
            success: {
                icon: '<i class="fas fa-check-circle"></i>',
                color: '#ffffff',
                background: '#1e7e34'
            },
            error: {
                icon: '<i class="fas fa-times-circle"></i>',
                color: '#ffffff',
                background: '#dc3545'
            },
            warning: {
                icon: '<i class="fas fa-exclamation-triangle"></i>',
                color: '#ffffff',
                background: '#fd7e14'
            },
            info: {
                icon: '<i class="fas fa-info-circle"></i>',
                color: '#ffffff',
                background: '#6c757d'
            }
        };

        const style = config[type] || config.info;

        Toastify({
            text: `<div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <span style="font-size: 20px; color: ${style.color}">
                        ${style.icon}
                    </span>
                    <span>${message}</span>
                   </div>`,
            duration: 900,
            gravity: "top",
            position: "center",
            stopOnFocus: true,
            escapeMarkup: false,
            className: "toastify-custom",
            close: true,
            style: {
                background: style.background,
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                minWidth: '300px',
                display: 'flex',
                alignItems: 'center'
            }
        }).showToast();
    }
}

export default new Toast(); 