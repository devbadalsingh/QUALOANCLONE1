import axios from "axios";

export async function panVerify(id, pan) {
    const data = {
        client_ref_num: `${id}`,
        pan: `${pan}`,
    };

    const response = await axios.post(
        "https://svc.digitap.ai/validation/kyc/v1/pan_details",
        data,
        {
            headers: {
                authorization: process.env.DIGITAP_AUTH_KEY,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
}