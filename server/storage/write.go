package storage

import (
	"encoding/json"
	"io/ioutil"
)

func Write(name string, data interface{}) {
	file, _ := json.MarshalIndent(data, "", " ")
	_ = ioutil.WriteFile(name, file, 0644)
}
