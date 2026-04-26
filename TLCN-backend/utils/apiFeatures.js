class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Remove empty string values (e.g. brand=&color=&ram=&demand=)
    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key] === "" || queryObj[key] === undefined) {
        delete queryObj[key];
      }
    });

    // Map filter params to their actual schema paths under specs.*
    const specsMap = { color: "specs.color", ram: "specs.ram", demand: "specs.demand" };
    Object.keys(specsMap).forEach((key) => {
      if (queryObj[key]) {
        queryObj[specsMap[key]] = queryObj[key];
        delete queryObj[key];
      }
    });

    const colorMapping = {
      "Đen": "Black",
      "Vàng": "Gold",
      "Trắng": "White",
      "Trắng ": "White",
      "Bạc": "Silver",
      "Xám": "Gray",
      "Xanh": "Blue"
    };

    const demandMapping = {
      "Văn-phòng": "Office",
      "Văn phòng": "Office",
      "Học-sinh-Sinh-viên": "Study",
      "Học sinh Sinh viên": "Study",
      "Học sinh - Sinh viên": "Study",
      "Đồ-họa-kỹ-thuật": "Design",
      "Đồ họa kỹ thuật": "Design",
      "Đồ họa - Kỹ thuật": "Design",
      "Gaming": "Gaming",
      "Doanh nhân": "Business"
    };

    Object.keys(queryObj).forEach(function (key) {
      if (key != "price" && key != "promotion") {
        if (key != "keyword") {
          const rawValues = queryObj[key].split(",").filter((v) => v !== "");
          if (rawValues.length > 0) {
            let processedValues = [];
            if (key === "specs.color") {
              processedValues = rawValues.map(v => colorMapping[v.trim()] || colorMapping[v] || v);
            } else if (key === "specs.demand") {
              processedValues = rawValues.map(v => demandMapping[v.trim()] || demandMapping[v] || v.replace(/-/g, " ").trim());
            } else if (key === "specs.ram") {
              processedValues = rawValues.map(v => new RegExp("^" + v.trim() + "GB", "i"));
            } else {
              processedValues = rawValues.map(v => v.replace(/-/g, " ").trim());
            }
            queryObj[key] = { $in: processedValues };
          } else {
            delete queryObj[key];
          }
        }
        if (key == "keyword") {
          queryObj["$text"] = { $search: queryObj[key] };
          delete queryObj[key];
        }
      }
    });
    
    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    
    // Restore regexes that were stringified
    if (queryObj["specs.ram"]) {
       const parsed = JSON.parse(queryStr);
       parsed["specs.ram"] = queryObj["specs.ram"]; // keep the actual RegExp objects
       this.query = this.query.find(parsed);
       console.log("MongoDB Query:", parsed);
       return this;
    }

    console.log("MongoDB Query:", JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-_id");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
