function objcpy(dstObj, srcObj, check=true)
{
  for (const p of srcObj)
  {
    if (check && dstObj.get(p[0]) == null)
      continue;
    dstObj.set(p[0], p[1]);
  }

  return dstObj;
}

function updateHistory(params, defParams=new Map(), hash=null, add=true)
{
  var urlParams = new URLSearchParams();

  for (const p of params)
  {
    if (p[1] === defParams.get(p[0]))
    {
      continue;
    }

    urlParams.set(p[0], p[1]);
  }

  var historyFunc = add ?
    history.pushState :
    history.replaceState;

  if (hash == null)
    hash = location.hash;

  var state = objcpy(new URLSearchParams(), params, false).toString();
  //console.log(state);

  // TODO: bug - update history doesn't update css target
  historyFunc.call(history,
    state,
    document.title,
    ((urlParams.toString() === "") ?
      location.pathname :
      "?" + urlParams.toString()) + hash);
}

function getFormDefVal(obj)
{
  if (obj.tagName === "FORM")
  {
    var params = new Map();

    for (let o of obj)
    {
      if (o.name !== "")
      {
        let v = getFormDefVal(o);
        if (v != null)
          params.set(o.name, v);
      }
    }

    return params;
  }

  if (obj.disabled)
  {
    return null;
  }

  if (obj.tagName === "INPUT")
  {
    if (obj.type === "checkbox")
      return obj.defaultChecked ? (obj.value === "" ? "on" : obj.value) : "";
    else if (obj.type === "radio")
      return obj.defaultChecked ? obj.value : null;
    return obj.defaultValue;
  }

  if (obj.tagName === "SELECT")
  {
    for (let o of obj.options)
      if (o.defaultSelected)
        return o.value;
    return null;
  }

  return null;
}

class FormWrapper
{
  constructor(objForm)
  {
    this.objForm = objForm;
  }
  has(key)
  {
    return this.objForm[key] != null;
  }
  get(key)
  {
    if (!this.has(key))
      return undefined;
    return this.objForm[key].value;
  }
  set(key, value)
  {
    if (!this.has(key))
      returun;

    var obj = this.objForm[key];

    if (obj.tagName == null) /* RadioNodeList */
    {
      for (let o of obj)
      {
        if (!o.disabled)
        {
          if (!(o.tagName === "INPUT" && o.type === "radio"))
            obj = o;
          break;
        }
      }
    }

    if (obj.tagName === "INPUT" && obj.type === "checkbox")
    {
      obj.checked = Boolean(value);
    }
    else
    {
      obj.value = value;
    }
    return this;
  }
  [Symbol.iterator]()
  {
    var params = new Map();

    for (let o of this.objForm)
    {
      if (o.tagName === "INPUT" && o.type === "checkbox")
      {
        if (o.name !== "" && !o.checked)
          params.set(o.name, "");
      }
    }

    return objcpy(params, new FormData(this.objForm), false)[Symbol.iterator]();
  }
}

class UrlForm
{
  constructor(objForm, updateFunc, hashFunc, paramsWrapper=null)
  {
    this.ready = false;
    this.objForm = objForm;
    this.defParams = getFormDefVal(this.objForm);
    this.updateFunc = updateFunc;
    this.hashFunc = hashFunc || (() => { return null; });
    this.paramsWrapper = paramsWrapper || ((params) => { return params; });

    window.addEventListener('popstate', (e) => {
      this.init(e.state);
    }, false);
  }
  init(queryString)
  {
    if (queryString == null)
      queryString = location.search;

    this.ready = false;
    var params = objcpy(
      new FormWrapper(this.objForm),
      this.paramsWrapper(new URLSearchParams(queryString)));
    updateHistory(params, this.defParams, this.hashFunc(params), false);
    this.update();
    this.ready = true;
  }
  update()
  {
    var params = new FormWrapper(this.objForm);

    params = this.updateFunc(params);
    this.defParams = getFormDefVal(this.objForm);

    if (this.ready)
      updateHistory(params, this.defParams, this.hashFunc(params), true);
  }
}

function stickElement(sticky, sibling)
{
  var top = sticky.offsetTop;
  var height = sibling.offsetTop - sticky.offsetTop;

  window.addEventListener("scroll", function(e) {
    if (window.pageYOffset >= top) {
      sticky.classList.add("sticky");
      sticky.style.top = "0";
      sibling.style.marginTop = height + "px";
    } else {
      sticky.classList.remove("sticky");
      sticky.style.top = "";
      sibling.style.marginTop = "";
    }
  });

  window.dispatchEvent(new UIEvent('scroll'));
}
