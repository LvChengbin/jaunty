Template Spec.

Bind events : @click, @submit

Normal variables : {{ variable }}, {{ n + 1 }}, {{ n ? 'YES' : 'NO' }}, {{ n.trim() }}, {{ func( n ) }}, {{ n && 'YES' }}

Pre-defined const : package, this, window, document, J

Directives : 
    :skip,
    :pre,
    :once,
    :if, :else
    :show, 
    :for...of, :for...in, :each, 
    :prevent, :stop,
    :model,
    :mount, 
    :mark, :ref, 
    :html
    :text

<div :if="display">
    <section :show="show">
        <header>
            <h1 :if="h1">{{ h1 }}</h1>
            <h1 :else>Default Heading</h1>
        </header>
        <ul :mark="list">
            <li :for="item of list">
                {{ item.text }}
                <p :pre>{{ABC}}</p>
            </li>
        </ul>
        <ul :ref="list"></ul>
        <footer>
            <a :prevent :stop>Save</a>
        </footer>
    </section>
    <form :submit="save" :prevent>
        <input type="text" $value="name" :model="name" />
        <select :mount="http://domain.com/packages/select"></select>
    </form>
</div>
