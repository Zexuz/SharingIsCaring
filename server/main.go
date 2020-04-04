package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"server/storage"
)

type SetCookiesRequest struct {
	Cookies []Cookie `json:"cookies"`
	Id      string   `json:"id"`
}

type Cookie struct {
	Domain         string  `json:"domain"`
	HostOnly       bool    `json:"hostOnly"`
	HTTPOnly       bool    `json:"httpOnly"`
	Name           string  `json:"name"`
	Path           string  `json:"path"`
	SameSite       string  `json:"sameSite"`
	Secure         bool    `json:"secure"`
	StoreID        string  `json:"storeId"`
	Value          string  `json:"value"`
	ExpirationDate float64 `json:"expirationDate,omitempty"`
}

func main() {
	r := gin.Default()
	r.POST("/api/v1/cookies", func(c *gin.Context) {

		data := new(SetCookiesRequest)
		err := c.BindJSON(data)
		if err != nil {
			_ = c.AbortWithError(400, err)
			return
		}
		storage.Write(data.Id, data.Cookies)
		c.String(200, fmt.Sprintf("%#v", data))
	})
	r.GET("/api/v1/cookies", func(c *gin.Context) {
		domain := c.Query("domain")
		cookiesBytes, err := storage.Read(domain)
		if err != nil {
			_ = c.AbortWithError(400, err)
			return
		}
		c.Data(200, "application/json", cookiesBytes)
	})
	_ = r.Run("0.0.0.0:8087") // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
