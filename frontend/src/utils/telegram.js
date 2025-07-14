// frontend/src/utils/telegram.js

// Получаем реальный объект Telegram Web App, если он существует
const tg = window.Telegram.WebApp;

// Создаем объект-заглушку для разработки в браузере
const tgMock = {
    ready: () => console.log('Mock TG: ready'),
    expand: () => console.log('Mock TG: expand'),
    close: () => console.log('Mock TG: close'),
    sendData: (data) => {
        console.log("Данные, которые были бы отправлены боту:");
        console.log(data);
        alert("Данные для заказа выведены в консоль (F12). В реальном Telegram Web App окно бы закрылось.");
    },
    showAlert: (message) => alert(message),
    HapticFeedback: {
        notificationOccurred: (type) => console.log(`Mock Haptic: ${type}`),
    },
    BackButton: {
        show: () => console.log('Mock BackButton: show'),
        hide: () => console.log('Mock BackButton: hide'),
        onClick: (cb) => { console.log('Mock BackButton: onClick handler set'); cb(); },
        offClick: () => console.log('Mock BackButton: onClick handler removed'),
    },
    // Добавляем пустые данные, чтобы приложение не падало при обращении к ним
    initDataUnsafe: {
        user: {
            first_name: 'Test',
            last_name: 'User'
        }
    }
};

// Экспортируем либо реальный объект, либо заглушку
export const useTelegram = () => {
    return tg ? tg : tgMock;
};