// import axios from 'axios'
// import { showAlert } from './alerts'
// const stripe = Stripe('pk_test_51LY0seIG0LjcKqiV8fPyBVN8I8KExoIx1k4OZMP4thiE2JQnlxiJSqrjGGz2cXJeUA1V0YAAUDoHha4pxT5qoBhw00ehq87HGz')// 公钥

// export const bookTour = async trouid => {
//     try{

//         // 1) 从API获取结帐会话
//         const session = await axios(`http://localhost/api/v1/booking/checkout-session/${tourid}`)
    
    
//         // 2) 创建结帐表格+ 更改信用卡
//         await stripe.redirectToCheckout({
//             sessionId: session.data.session.id
//         })

//     }catch(err){
//         console.log(err)
//         showAlert('error', err);
//     }
// }

