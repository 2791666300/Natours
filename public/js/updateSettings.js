import axios from 'axios'
import { showAlert } from './alerts'


// type 是“密码”或“数据”
export const updateSettings = async (data, type) => {
    try {
        const url = type === '密码' ? 'http://localhost:1000/api/v1/users/updatePassword' : 'http://localhost:1000/api/v1/users/updateMe'

        const res = await axios({
            method: 'PATCH',
            url: url,
            data: data
        })
        
        if (res.data.status === 'success') {
            showAlert('success', `${type}更改成功！！`)
        }

    }catch(err){
        showAlert('error', err.response.data.message)
    }
}

