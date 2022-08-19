import axios from 'axios'
import { showAlert } from './alerts'

export const login = async (email, password) => {
    
    try {
       
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:1000/api/v1/users/login',
            data: {
                email,
                password
            }
        })

        // console.log(res)
        if(res.data.status === 'success'){
            showAlert('success', '登录成功！！')
            window.setTimeout(() => {
                location.assign('/')
            }, 1500)
        }
    }catch(err){
        showAlert('error', err.response.data.message)
    }
}

export const logout = async () => {
    try{
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:1000/api/v1/users/logout'
        })
        console.log(res)
        if(res.data.status = 'success') location.reload(true) // 从服务器重新刷新，
            
        
    }catch(err){
       
        showAlert('error', '请重新尝试')
    }
}


