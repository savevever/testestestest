<template>
    <div class="container">
        <div id="storeContainer">
            <div id="storeLeft">
                <div id="storeLeftIMG">
                    <router-link :to="{ path: '/store/storepage', query: { productId: productId } }">
                        <img :src="StoreImage ? StoreImage : require('@/assets/1.png')" alt="Store Image">
                    </router-link>
                </div>
                <div id="storeLeftTXT">
                    <p id="namestore">{{ shopName }}</p>
                    <div id="storeLeftButton">
                        <button @click="handleToggleFollow">
                            <font-awesome-icon :icon="['fas', 'plus']" class="font-awesome" />
                            <p>{{ StoreFollow ? 'ติดตามแล้ว' : 'ติดตาม' }}</p>
                        </button>
                        <button>
                            <font-awesome-icon :icon="['fas', 'house']" class="font-awesome" />
                            <p>หน้าร้าน</p>
                        </button>
                    </div>
                </div>
            </div>
            <div id="line"></div>
            <div id="storeRight">
                <p>คะแนน: 51.9พัน</p>
                <p>รายการสินค้า:<span>{{ filteredProducts.length }}</span></p>
                <p>เข้าร่วมเมื่อ: {{ createdAt }}</p>
                <p>ผู้ติดตาม: <span>{{ followerCount }}</span> คน</p>
            </div>
        </div>
    </div>
</template>

<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlus, faComment, faHouse } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

library.add(faPlus, faComment, faHouse);

export default {
    components: {
        FontAwesomeIcon,
    },
    data() {
        return {
            shopId: null,
            shopName: '',
            productId: null,
            StoreFollow: false,
            followerCount: 0,
            filteredProducts: [],
            StoreImage: "",
            products: [],
            userEmail: ''
        };
    },
    async mounted() {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userObject = JSON.parse(user);
                this.userEmail = userObject.email;
                this.productId = new URLSearchParams(window.location.search).get('productId');
                this.fetchProductDetails();
                this.fetchShopDetails();
            } catch (error) {
                console.error('Error parsing user from localStorage:', error);
            }
        } else {
            console.warn('No user found in localStorage');
        }
        this.productId = new URLSearchParams(window.location.search).get('productId');
        if (this.productId) {
            await this.fetchProductDetails();
            this.fetchShopDetails();
        }
    },
    methods: {
        async handleToggleFollow() {
            const productId = this.shopId;  
            try {
                const url = `http://localhost:8081/shop/product/${productId}/togglefollow`;
                const FollowChange = this.StoreFollow ? -1 : 1;

                const response = await axios.patch(url, {
                    FollowChange: FollowChange
                });

                console.log("Updated Follow:", response.data);
                this.StoreFollow = !this.StoreFollow;
            } catch (error) {
                console.error("Error toggling Follow:", error);
            }
        },
        async fetchProductDetails() {
            try {
                const response = await axios.get("http://localhost:8081/selling/productss");
                this.products = response.data || [];
                if (response.data && response.data.length > 0) {
                    const product = response.data.find(product => product.id == this.productId);
                    if (product) {
                        this.shopId = product.shopId;
                        console.log("this.shopId", this.shopId);

                    } else {
                        console.error('Product not found');
                    }
                } else {
                    console.error('No products found');
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
            }
        },

        fetchShopDetails() {
            try {
                if (this.shopId) {
                    axios.get('http://localhost:8081/shop/shops')
                        .then(response => {
                            const shops = response.data.data || [];
                            const shop = shops.find(shop => shop.shopId === this.shopId);
                            if (shop) {
                                this.shopName = shop.shopName;
                                this.createdAt = new Date(shop.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' });
                                this.StoreFollow = shop.isFollowing;
                                this.followerCount = shop.follow;
                                this.StoreImage = shop.image;
                                this.filteredProducts = this.products.filter(product => product.shopId === this.shopId);
                            } else {
                                console.error('Shop not found');
                            }
                        });
                }
            } catch (error) {
                console.error('Error fetching shop details:', error);
            }
        },
    }
};
</script>





<style scoped>
.container {
    display: flex;
    width: 1300px;
    flex-direction: column;
    align-items: center;
}

#storeContainer {
    width: 1285px;
    height: 114px;
    border-radius: 15px;
    background: #FFF;
    margin: 20px 0 20px 0;
    display: flex;
    padding: 10px;
}

#storeRight {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: flex-start;
}

#storeLeft {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 40px;
}

#storeRight p {
    font-size: 18px;
}

#storeLeftIMG img {
    width: 80px;
    height: 80px;
    border-radius: 40px;
    margin-right: 15px;
}

#line {
    width: 3px;
    height: 100px;
    background-color: rgb(116, 111, 111);
    margin-right: 40px;
}

#namestore {
    font-size: 29px;
}

#storeLeftTXT {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

#storeLeftTXT button {
    display: flex;
    align-items: center;
    justify-content: center;
}

#storeLeftTXT p {
    margin: 0;
}

#storeLeftButton {
    display: flex;
    gap: 0.5rem;
}


#storeLeftButton button:first-child {
    background-color: #73FF67;
    border: 0.5px solid #398b32;
}

#storeLeftButton button:nth-child(2) {
    background-color: #67F6FF;
    border: 0.5px solid #33898f;
}

#storeLeftButton button:nth-child(3) {
    background-color: #FF9E67;
    border: 0.5px solid #7e492a;
    width: 80px;
}

.font-awesome {
    width: 13px;
    height: 18px;
    margin-right: 5px;
}
</style>